registerPlugin(
	{
		name: "Admin Actions Logger",
		version: "1.0.0",
		description: "Log and read admin actions",
		author: "DrWarpMan <drwarpman@gmail.com>",
		backends: ["ts3"],
		engine: ">= 1.0",
		autorun: false,
		enableWeb: false,
		hidden: false,
		requiredModules: ["http"],
		voiceCommands: [],
		vars: [
			{
				name: "logEnabled",
				type: "checkbox",
				title: "Check to enable detailed logs",
				default: false,
			},
			{
				name: "apiURL",
				type: "string",
				title: "API URL:",
				default: "",
				placeholder: "http://ip:port/pdf",
			},
			{
				name: "apiPassword",
				type: "password",
				title: "API password:",
				default: "",
				placeholder: "12345",
			},
			{
				name: "apiAccessAdminUIDs",
				type: "strings",
				title: "UIDs of clients that can use script commands:",
				default: [],
			},
			{
				name: "apiAccessGroupIDs",
				type: "strings",
				title: "Group IDs that can use script commands:",
				default: [],
			},
			{
				name: "apiCommand",
				type: "string",
				title:
					"API access command\nSyntax: <command> <day> <month> <year>\nIf you want to specify today, use 0 for both month and day argument, year is optional, if you don't specify, it should fall back to the current year",
				default: "aal",
				placeholder: "aal (stands for Admin Actions Logger)",
			},
			{
				name: "deleteOldDataCommand",
				type: "string",
				title:
					"Command that will delete old data\nSyntax: <command> <daysOld>\nE.g.: Using value 10, will delete data that are more than 10 days old.",
				default: "aal-delete",
				placeholder: "aal-delete",
			},
			{
				name: "adminList",
				type: "array",
				title: "Admin list:",
				default: [],
				vars: [
					{
						name: "adminUID",
						type: "string",
						title: "Admin UID",
					},
					{
						name: "adminName",
						type: "string",
						title: 'Custom Admin Name (e.g.: "Tutulowsky")',
					},
					{
						name: "groupName",
						type: "string",
						title: 'Custom Group Name (e.g.: "Moderators")',
					},
				],
			},
		],
	},
	(_, config, { name, version, author }) => {
		const engine = require("engine");
		const backend = require("backend");
		const event = require("event");
		const store = require("store");
		const http = require("http");

		event.on("load", () => {
			const command = require("command");
			if (!command) throw new Error("command.js library missing!");

			const log = str => !!config.logEnabled && engine.log(str);

			// Config check
			const {
				adminList,
				apiURL,
				apiPassword,
				apiAccessAdminUIDs,
				apiAccessGroupIDs,
				apiCommand,
				deleteOldDataCommand,
			} = config;

			if (
				adminList.some(admin => {
					return Object.keys(admin).some(prop => admin[prop].length <= 0);
				}) ||
				!apiURL ||
				apiURL.length <= 0 ||
				!apiPassword ||
				apiPassword.length <= 0
			)
				return console.log(new Error("Missing fields in the configuration!"));
			else {
				initialize();
			}

			function initialize() {
				// Setup variables
				const STATE_TIME_INTERVAL = 60 * 1000;
				const ONLINE_TRACK_START = {};
				const STATE_TRACK_START = {};
				const CHANNEL_TRACK_START = {};
				const DAY_MS = 24 * 60 * 60 * 1000;

				setInterval(stateTimer, STATE_TIME_INTERVAL);
				stateLoad();

				// Events
				event.on("connect", () => setTimeout(stateLoad, 3 * 1000));

				command
					.createCommand(apiCommand)
					.help("Gives a link to a generated .pdf file with admin actions data")
					.checkPermission(client => hasAPIAccess(client))
					.addArgument(args =>
						args.number
							.setName("day")
							.min(1)
							.max(31)
							.integer()
							.optional(undefined, false)
					)
					.addArgument(args =>
						args.number
							.setName("month")
							.min(1)
							.max(12)
							.integer()
							.optional(undefined, false)
					)
					.addArgument(args =>
						args.number
							.setName("year")
							.min(2000)
							.max(3000)
							.integer()
							.optional(undefined, false)
					)
					.exec(async (_, { day, month, year }, reply) => {
						if (!day) day = _getDate();
						if (!month) month = _getMonth();
						if (!year) year = _getYear();

						const dataDate = new Date(`${month}/${day}/${year}`);

						if (!(dataDate instanceof Date && !isNaN(dataDate.getTime())))
							return reply("Invalid date!");

						const timestamp = setDateMidnight(dataDate).getTime();
						const data = getData(timestamp);

						if (!data || Object.keys(data).length === 0)
							return reply("No data found on the specified date!");

						reply("Requesting .PDF file... please wait!");

						const { filename, expiry } = await exportData(data, timestamp);

						if (filename !== false && expiry !== 0) {
							reply(
								`PDF created, it can be accessed at [URL=${
									apiURL + "/" + filename
								}]${filename}[/URL].`
							);

							return reply(`This file will automatically delete soon!`);
						} else {
							return reply("Fatal error ocurred, check the logs!");
						}
					});

				command
					.createCommand(deleteOldDataCommand)
					.help("Delete old data")
					.checkPermission(client => hasAPIAccess(client))
					.addArgument(args =>
						args.number
							.setName("days")
							.min(0)
							.max(Math.floor(Date.now() / DAY_MS) - 1)
							.integer()
					)
					.exec((_, { days }, reply) => {
						const d = setDateMidnight(new Date());
						let olderThanTimestamp;

						if (days === 0) olderThanTimestamp = d.getTime();
						else {
							const daysToMs = days * DAY_MS;
							olderThanTimestamp = d.getTime() - daysToMs;
						}

						let dataFound = false;

						store.getKeys().forEach(dateKey => {
							if (dateKey <= olderThanTimestamp) {
								store.unset(dateKey);
								dataFound = true;
							}
						});

						const olderThanDate = new Date(olderThanTimestamp);
						const olderThanDateStr = `${olderThanDate.getDate()}.${
							olderThanDate.getMonth() + 1
						}.${olderThanDate.getFullYear()}`;

						if (dataFound) {
							reply(`Data older than: ${olderThanDateStr} were deleted.`);
						} else {
							reply(`No data found beyond date: ${olderThanDateStr}`);
						}
					});

				event.on("clientMove", ({ client, toChannel, fromChannel }) => {
					if (client.isSelf()) return;

					const uid = client.uid();

					if (isAdmin(uid) === false) return;
					log(`clientMove: Admin ${uid}`);
					const timestamp = Date.now();

					if (!fromChannel && toChannel) {
						CHANNEL_TRACK_START[uid] = CHANNEL_TRACK_START[uid] || {};
						CHANNEL_TRACK_START[uid][toChannel.id()] = timestamp;
					}

					if (fromChannel && toChannel) {
						addChannelTime(uid, fromChannel.id(), fromChannel.name());
						CHANNEL_TRACK_START[uid] = CHANNEL_TRACK_START[uid] || {};
						CHANNEL_TRACK_START[uid][toChannel.id()] = timestamp;
					}

					if (fromChannel && !toChannel) {
						addChannelTime(uid, fromChannel.id(), fromChannel.name());
					}

					if (!toChannel) {
						log("Admin disconnected.");
						addConnection(uid, timestamp, 0);

						clientStateChanged(client, "away", 0);
						clientStateChanged(client, "mute", 0);
						clientStateChanged(client, "deaf", 0);
					}

					if (!fromChannel) {
						log("Admin connected.");
						addConnection(uid, timestamp, 1);

						ONLINE_TRACK_START[uid] = timestamp;

						clientStateChanged(client, "away", client.isAway());
						clientStateChanged(client, "mute", client.isMuted());
						clientStateChanged(client, "deaf", client.isDeaf());
					}
				});

				event.on("channelUpdate", (channel, client) => {
					if (!client) return; // fix undefined
					if (client.isSelf()) return;

					const uid = client.uid();
					if (isAdmin(uid) === false) return;
					log(`channelUpdate: Admin ${uid}`);
					const timestamp = Date.now();

					addChannelUpdate(uid, timestamp, channel.id(), channel.name());
				});

				event.on("serverGroupAdded", event => serverGroupChanged(event, 1));
				event.on("serverGroupRemoved", event => serverGroupChanged(event, 0));

				function serverGroupChanged(event, added) {
					if (event.client.isSelf()) return;
					const uid = event.invoker.uid();

					if (isAdmin(uid) === false) return;
					log(`groupChange: Admin ${uid}`);
					const timestamp = Date.now();

					const targetNick = event.client.nick();
					//const targetUID = event.client.uid();
					const groupName = event.serverGroup.name();
					//const groupID = event.group.id();

					addGroupChange(uid, timestamp, targetNick, groupName, added);
				}

				event.on("clientAway", client => clientStateChanged(client, "away", 1));
				event.on("clientBack", client => clientStateChanged(client, "away", 0));
				event.on("clientMute", client => clientStateChanged(client, "mute", 1));
				event.on("clientUnmute", client =>
					clientStateChanged(client, "mute", 0)
				);
				event.on("clientDeaf", client => clientStateChanged(client, "deaf", 1));
				event.on("clientUndeaf", client =>
					clientStateChanged(client, "deaf", 0)
				);

				function clientStateChanged(client, state, enabled) {
					if (client.isSelf()) return;
					const uid = client.uid();

					if (isAdmin(uid) === false) return;
					log(`clientState: Admin ${uid} - ${state}: ${enabled}`);

					STATE_TRACK_START[uid] = STATE_TRACK_START[uid] || {};
					if (enabled == 1) STATE_TRACK_START[uid][state] = Date.now();
					if (enabled == 0) addStateTime(uid, state);
				}

				// Functions

				function isAdmin(uid) {
					return adminList.some(({ adminUID }) => uid === adminUID);
				}

				function hasAPIAccess(client) {
					if (apiAccessAdminUIDs.includes(client.uid())) return true;
					else {
						const clientGroupIDs = client.getServerGroups().map(g => g.id());
						return apiAccessGroupIDs.some(gID => clientGroupIDs.includes(gID));
					}
				}

				function setDateMidnight(date) {
					return new Date(date.setHours(0, 0, 0, 0));
				}

				function getTodayTimestamp() {
					const date = new Date().setHours(0, 0, 0, 0);
					return `${date}`;
				}

				function _getDate() {
					return new Date().getDate();
				}

				function _getMonth() {
					return new Date().getMonth() + 1;
				}

				function _getYear() {
					return new Date().getFullYear();
				}

				function httpRequest(params) {
					return new Promise((resolve, reject) => {
						try {
							http.simpleRequest(params, (error, response) => {
								return resolve({
									error,
									response,
								});
							});
						} catch (err) {
							reject(err);
						}
					});
				}

				// Data saving

				function getData(date) {
					const data = store.get(date) || {};
					return data;
				}

				function setData(data) {
					return store.set(getTodayTimestamp(), data);
				}

				// Data reading..

				async function exportData(data, timestamp) {
					let pdf = {
						filename: false,
						expiry: 0,
					};

					const dataBody = {
						date: timestamp,
						groups: {},
					};

					adminList.forEach(({ adminUID, adminName, groupName }) => {
						dataBody.groups[groupName] = dataBody.groups[groupName] || [];

						const adminData = {
							adminUID,
							adminName,
							data: data[adminUID] || {},
						};

						dataBody.groups[groupName].push(adminData);
					});

					const { error, response } = await httpRequest({
						method: "POST",
						url: apiURL,
						timeout: 10000,
						headers: {
							Authorization: apiPassword,
							"Content-Type": "application/json",
						},
						body: JSON.stringify(dataBody),
					});

					if (error) {
						engine.log("PDF API - Error: " + error);
						return pdf;
					}

					if (response.statusCode != 200) {
						engine.log("PDF API - HTTP Error: " + response.status);
						return pdf;
					}

					engine.log("PDF API - Response: " + response.status);
					pdf = JSON.parse(response.data.toString());

					return pdf;
				}

				// Data writing..

				function stateLoad() {
					if (backend.isConnected()) {
						const onlineAdmins = adminList
							.map(({ adminUID }) => {
								return backend.getClientByUID(adminUID);
							})
							.filter(admin => admin);

						for (const admin of onlineAdmins) {
							const uid = admin.uid();

							// Online time

							ONLINE_TRACK_START[uid] = Date.now();

							// States

							const states = {
								mute: admin.isMuted(),
								away: admin.isAway(),
								deaf: admin.isDeaf(),
							};

							STATE_TRACK_START[uid] = STATE_TRACK_START[uid] || {};
							Object.keys(states).forEach(state => {
								const enabled = states[state];
								if (enabled) STATE_TRACK_START[uid][state] = Date.now();
							});

							// Channel time

							const channelID = admin.getChannels()[0].id();
							CHANNEL_TRACK_START[uid] = CHANNEL_TRACK_START[uid] || {};
							CHANNEL_TRACK_START[uid][channelID] = Date.now();
						}
					}
				}

				function stateTimer() {
					if (backend.isConnected()) {
						const onlineAdmins = adminList
							.map(({ adminUID }) => {
								return backend.getClientByUID(adminUID);
							})
							.filter(adminClient => !!adminClient);

						for (const admin of onlineAdmins) {
							const uid = admin.uid();
							addOnlineTime(uid);

							const states = {
								mute: admin.isMuted(),
								away: admin.isAway(),
								deaf: admin.isDeaf(),
							};

							Object.keys(states).forEach(state => {
								const enabled = states[state];

								if (enabled) {
									addStateTime(uid, state);
									STATE_TRACK_START[uid][state] = Date.now();
								}
							});
						}
					}
				}

				function addOnlineTime(uid) {
					const data = getData(getTodayTimestamp());
					data[uid] = data[uid] || {};
					data[uid].onlineTime = data[uid].onlineTime || 0;

					const addTime = Date.now() - ONLINE_TRACK_START[uid];
					ONLINE_TRACK_START[uid] = Date.now(); // reset

					data[uid].onlineTime += addTime;

					setData(data);
					//console.log(data[uid].onlineTime);
				}

				function addConnection(uid, timestamp, connected) {
					const data = getData(getTodayTimestamp());
					data[uid] = data[uid] || {};
					data[uid].connections = data[uid].connections || [];

					data[uid].connections.push({
						timestamp,
						connected,
					});

					setData(data);
					//console.log(data[uid].connections);
				}

				function addChannelUpdate(uid, timestamp, channelID, channelName) {
					const data = getData(getTodayTimestamp());
					data[uid] = data[uid] || {};
					data[uid].channelUpdates = data[uid].channelUpdates || [];

					data[uid].channelUpdates.push({
						timestamp,
						channelID,
						channelName,
					});

					setData(data);
					//console.log(data[uid].channelUpdates);
				}

				function addChannelTime(uid, channelID, channelName) {
					const data = getData(getTodayTimestamp());
					data[uid] = data[uid] || {};
					data[uid].channelTimes = data[uid].channelTimes || {};

					data[uid].channelTimes[channelID] =
						data[uid].channelTimes[channelID] || {};
					data[uid].channelTimes[channelID].channelName = channelName;
					data[uid].channelTimes[channelID].timestamp =
						data[uid].channelTimes[channelID].timestamp || 0;
					data[uid].channelTimes[channelID].timestamp +=
						Date.now() - CHANNEL_TRACK_START[uid][channelID];

					setData(data);
					//console.log(data[uid].channelTimes);
				}

				function addGroupChange(uid, timestamp, targetNick, groupName, added) {
					const data = getData(getTodayTimestamp());
					data[uid] = data[uid] || {};
					data[uid].groupChanges = data[uid].groupChanges || [];

					data[uid].groupChanges.push({
						timestamp,
						targetNick,
						groupName,
						added,
					});

					setData(data);
					//console.log(data[uid].groupChanges);
				}

				function addStateTime(uid, state) {
					if (!STATE_TRACK_START[uid][state]) return;

					const data = getData(getTodayTimestamp());
					data[uid] = data[uid] || {};
					data[uid].clientStates = data[uid].clientStates || {};
					data[uid].clientStates[state] = data[uid].clientStates[state] || 0;

					data[uid].clientStates[state] +=
						Date.now() - STATE_TRACK_START[uid][state];

					delete STATE_TRACK_START[uid][state];

					setData(data);
					//console.log(data[uid].clientStates);
				}
			}
		});

		engine.log(
			`\n[LOADED] Script: "${name}" Version: "${version}" Author: "${author}"`
		);
	}
);
