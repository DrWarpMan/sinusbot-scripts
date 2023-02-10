registerPlugin(
	{
		name: "Steam Status",
		version: "1.1.0",
		description: "Shows Steam status of configured Steam users in specified channel name",
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
				name: "logLevel",
				type: "select",
				title: "Log Level:",
				options: ["ERROR", "WARN", "INFO"],
				default: "0",
			},
			{
				name: "APIKey",
				type: "password",
				title: "API key (get yours at https://steamcommunity.com/dev/apikey):",
				default: "",
			},
			{
				name: "checkInterval",
				type: "number",
				title: "Check Interval (in minutes)",
				default: 1,
				placeholder: "1",
			},
			{
				name: "showDefaultStatusConfig",
				type: "checkbox",
				title: "Show default channel name configuration",
				default: false,
			},
			{
				name: "status_Offline",
				type: "string",
				title: "Status Text Offline:",
				placeholder: "%personaname% status: Offline",
				default: "%personaname% status: Offline",
				conditions: [{ field: "showDefaultStatusConfig", value: 1 }],
				indent: 1,
			},
			{
				name: "status_Online",
				type: "string",
				title: "Status Text Online:",
				placeholder: "%personaname% status: Online",
				default: "%personaname% status: Online",
				conditions: [{ field: "showDefaultStatusConfig", value: 1 }],
				indent: 1,
			},
			{
				name: "status_Busy",
				type: "string",
				title: "Status Text Busy:",
				placeholder: "%personaname% status: Busy",
				default: "%personaname% status: Busy",
				conditions: [{ field: "showDefaultStatusConfig", value: 1 }],
				indent: 1,
			},
			{
				name: "status_Away",
				type: "string",
				title: "Status Text Away:",
				placeholder: "%personaname% status: Away",
				default: "%personaname% status: Away",
				conditions: [{ field: "showDefaultStatusConfig", value: 1 }],
				indent: 1,
			},
			{
				name: "status_Snooze",
				type: "string",
				title: "Status Text Snooze:",
				placeholder: "%personaname% status: Snooze",
				default: "%personaname% status: Snooze",
				conditions: [{ field: "showDefaultStatusConfig", value: 1 }],
				indent: 1,
			},
			{
				name: "status_LookingToTrade",
				type: "string",
				title: "Status Text Looking To Trade:",
				placeholder: "%personaname% status: Looking to trade",
				default: "%personaname% status: Looking to trade",
				conditions: [{ field: "showDefaultStatusConfig", value: 1 }],
				indent: 1,
			},
			{
				name: "status_LookingToPlay",
				type: "string",
				title: "Status Text Looking To Play:",
				placeholder: "%personaname% status: Looking to play",
				default: "%personaname% status: Looking to play",
				conditions: [{ field: "showDefaultStatusConfig", value: 1 }],
				indent: 1,
			},
			/*
			{
				name: "status_Invisible",
				type: "string",
				title: "Status Text Invisible:",
				placeholder: "%personaname% status: Invisible",
				default: "%personaname% status: Invisible",
				conditions: [{ field: "showDefaultStatusConfig", value: 1 }],
				indent: 1,
			},*/
			{
				name: "steamUsers",
				type: "array",
				title: "Steam Users Configuration:",
				default: [],
				vars: [
					{
						name: "channelID",
						type: "string",
						title: "Channel ID:",
						placeholder: "123",
					},
					{
						name: "steamID64",
						type: "string",
						title: "Steam ID (64-bit Steam ID):",
						placeholder: "76561198848779214"
					},
					{
						name: "status_Offline",
						type: "string",
						title: "[Custom] Status Text Offline:",
						placeholder: "%personaname% status: Offline",
					},
					{
						name: "status_Online",
						type: "string",
						title: "[Custom] Status Text Online:",
						placeholder: "%personaname% status: Online",
					},
					{
						name: "status_Busy",
						type: "string",
						title: "[Custom] Status Text Busy:",
						placeholder: "%personaname% status: Busy",
					},
					{
						name: "status_Away",
						type: "string",
						title: "[Custom] Status Text Away:",
						placeholder: "%personaname% status: Away",
					},
					{
						name: "status_Snooze",
						type: "string",
						title: "[Custom] Status Text Snooze:",
						placeholder: "%personaname% status: Snooze",
					},
					{
						name: "status_LookingToTrade",
						type: "string",
						title: "[Custom] Status Text Looking To Trade:",
						placeholder: "%personaname% status: Looking to trade",
					},
					{
						name: "status_LookingToPlay",
						type: "string",
						title: "[Custom] Status Text Looking To Play:",
						placeholder: "%personaname% status: Looking to play",
					},
					/*{
						name: "status_Invisible",
						type: "string",
						title: "[Custom] Status Text Invisible:",
						placeholder: "%personaname% status: In-Game",
					},*/
				]
			}
		],
	},
	(_, config, { name, version, author }) => {
		const engine = require("engine");
		const http = require("http");
		const backend = require("backend");
		const event = require("event");

		event.on("load", () => {
			// Libraries

			const logger = require("log");
			if(!logger) throw new Error("Log library not found!");
			const log = logger(engine, parseInt(config.logLevel));

			const zod = require("zod");
			if(!zod) throw new Error("Zod library not found!");
			const {z} = zod;
			
			// Variables

			const { APIKey, steamUsers } = config;

			const Type_CheckInterval = z.number().int().min(1).max(30);
			let checkInterval = 1;
			try {
				checkInterval = Type_CheckInterval.parse(checkInterval);
			} catch(err) {
				console.log(err);
				log("WARN", "Check Interval was set incorrectly, defaulting to 1 minute.");
			}

			const Type_Response_GetPlayerSummaries = z.object({
				response: z.object({
					players: z.array(z.object({
						personaname: z.string().min(2).max(32),
						personastate: z.number().int().min(0).max(6),
					})).min(1).max(1)
				})
			});

			/*
				Source:
				- https://developer.valvesoftware.com/wiki/Steam_Web_API#GetPlayerSummaries
				- https://raw.githubusercontent.com/DoctorMcKay/node-steam-user/master/enums/EPersonaState.js
			*/
			const StatusEnum = /** @type {const} */ ({
				0: "Offline",
				1: "Online",
				2: "Busy",
				3: "Away",
				4: "Snooze",
				5: "LookingToTrade",
				6: "LookingToPlay",
				//7: "Invisible",
				"Offline": 0,
				"Online": 1,
				"Busy": 2,
				"Away": 3,
				"Snooze": 4,
				"LookingToTrade": 5,
				"LookingToPlay": 6,
				//"Invisible": 7,
			});

			const CHANNEL_NAME_LENGTH = 40;

			async function checkSteamUsers() {
				if (!backend.isConnected()) {
					log("WARN", "Backend not connected, skipping check.");
					return;
				}

				log("INFO", "Checking Steam Users.");

				for (const steamUser of steamUsers) {
					const {
						steamID64,
						channelID
					} = steamUser;

					log("INFO",
						`Checking: ${steamID64} (channel ID: ${channelID})`
					);

					const channel = backend.getChannelByID(channelID);
					if (!channel) {
						log("WARN", `Channel (${channelID}) not found, skipping..`);
						continue;
					}

					try {
						const { statusCode, status: httpStatus, data: body } = await GetPlayerSummaries(steamID64);
						
						if(statusCode !== 200) {
							throw new Error(`HTTP error - ${statusCode}: ${httpStatus}`);
						}
		
						const data = JSON.parse(body.toString());

						const { response: { players } } = Type_Response_GetPlayerSummaries.parse(data);
						const playerSummary = players[0];

						log("INFO", `Status (int): ${playerSummary.personastate}`);

						/*
						 *	CHANNEL NAME 
						 */
					
						const statusText =
							steamUser[`status_${StatusEnum[playerSummary.personastate]}`]
							|| config[`status_${StatusEnum[playerSummary.personastate]}`]
							|| "";

						let channelName = statusText.replace("%personaname%",
							escapePersonaNameAgainstSpacer(playerSummary.personaname.trim())
						);
						let overflow = CHANNEL_NAME_LENGTH - channelName.length;
						if (overflow < 0) {
							overflow = Math.abs(overflow);
							log("WARN", `Channel name would overflow (${overflow}): ${channelName}, shortening..`);
							channelName = channelName.substring(0, channelName.length - overflow);
						}

						if (channelName.length <= 0) {
							log("WARN", `Channel name resulted to be empty? (${steamID64})`);
						} else {
							log("INFO", `Final channel name: ${channelName}`);
						}
						
						log("INFO", "Updating channel..");

						// @ts-ignore
						channel.update({
							name: channelName || channel.name(),
						});
					} catch (err) {
						console.log(err);
						log("ERROR", `Error ocurred, skipping user ${steamID64} (ch: ${channelID})`);
						continue;
					}
				}
			}

			function escapePersonaNameAgainstSpacer(str) {
				const regex = /^\[.*spacer.*\]/gi;
				return str.replace(regex, match => `\\${match}`);
			}

			function GetPlayerSummaries(steamID64) {
				return httpRequest({
					method: "GET",
					url: "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/"
						+ `?key=${APIKey}`
						+ `&steamids=${steamID64}`,
					timeout: 10000,
				});
			}

			function httpRequest(config) {
				return new Promise((resolve, reject) => {
					try {
						http.simpleRequest(config, (err, res) => {
							if (err) {
								return reject(new Error(err));
							}

							return resolve(res);
						});
					} catch (err) {
						return reject(err);
					}
				});
			}

			setInterval(checkSteamUsers, checkInterval * 60 * 1000);

			engine.log(`Loaded: ${name} | v${version} | ${author}`);
		});
	}
);
