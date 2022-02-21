const PREFIX = {
	RANK: "rank_",
	REGION: "region_",
	SHOW: "show_",
	MSG: "msg_",
	CMD: "cmd_",
};

const RANKS = {
	CHALLENGERI: 27,
	GRANDMASTERI: 26,
	MASTERI: 25,
	DIAMONDI: 24,
	DIAMONDII: 23,
	DIAMONDIII: 22,
	DIAMONDIV: 21,
	PLATINUMI: 20,
	PLATINUMII: 19,
	PLATINUMIII: 18,
	PLATINUMIV: 17,
	GOLDI: 16,
	GOLDII: 15,
	GOLDIII: 14,
	GOLDIV: 13,
	SILVERI: 12,
	SILVERII: 11,
	SILVERIII: 10,
	SILVERIV: 9,
	BRONZEI: 8,
	BRONZEII: 7,
	BRONZEIII: 6,
	BRONZEIV: 5,
	IRONI: 4,
	IRONII: 3,
	IRONIII: 2,
	IRONIV: 1,
	UNRANKED: 0,
};

const REGIONS = {
	BR: "BR1",
	EUNE: "EUN1",
	EUW: "EUW1",
	JP: "JP1",
	KR: "KR",
	LAN: "LA1",
	LAS: "LA2",
	NA: "NA1",
	OCE: "OC1",
	RU: "RU",
	TR: "TR1",
};

const COMMANDS = {
	main: "lol",
	link: "link",
	unlink: "unlink",
	verify: "verify",
};

const TRANSLATION = {
	error: "An error has ocurred, please contact an administrator!",
	regionNotAllowed: "This region is not allowed!",
	accountAlreadyLinked: "You already have a linked account!",
	accountNotLinked: "You do not have any account linked!",
	accountUnlinked: "Account unlinked successfully!",
	accountLinked: "Account successfully linked!",
	accountAlreadyVerified: "Account is already verified!",
	accountAlreadyClaimed: "Account was already linked by someone else!",
	verificationCode:
		"Put the following code [b]%code%[/b] into your League of Legends client, then repeat the command!",
	verificationSuccessful: "Verification successful!",
	verificationInvalid: "Verification code is either invalid or not found!",
	commandsPaused: "Commands are currently disabled, please try again later!",
};

function extendedConfig() {
	const entries = [];

	const checkBox = (name, title, value = false, extra = {}) => {
		entries.push({
			...{
				name,
				type: "checkbox",
				title: title,
				default: value,
			},
			...extra,
		});
	};

	entries.push({
		name: "API_KEY",
		type: "password",
		title: "API key (developer.riotgames.com):",
		placeholder: "RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
		default: "",
	});

	entries.push({
		name: "RANK_DISPLAY_METHOD",
		type: "select",
		title: "What rank should be displayed?",
		options: ["HIGHEST (default)", "SOLO ONLY", "FLEX ONLY"],
		default: "0",
	});

	entries.push({
		name: "GROUPS",
		type: "strings",
		title: "Group IDs list, that are allowed to use the commands:",
		default: [],
	});

	checkBox("GROUPS_BLACKLIST", "Consider the previous list of groups as a blacklist?");

	entries.push({
		name: "VERIFICATION_TIME",
		type: "number",
		title: "Time for verification in seconds:",
		default: 120,
		placeholder: 120,
	});

	entries.push({
		name: "REFRESH_ONLINE_INTERVAL",
		type: "number",
		title: "How often will ranks of online clients be refreshed in minutes [Minimum: 30 minutes]:",
		default: 30,
		placeholder: 30,
	});

	checkBox(PREFIX.SHOW + "commands", "Show commands configuration");

	Object.keys(COMMANDS).forEach(cmdName => {
		entries.push({
			name: PREFIX.CMD + cmdName,
			type: "string",
			title: `${cmdName[0].toUpperCase() + cmdName.slice(1)} command:`,
			default: COMMANDS[cmdName],
			placeholder: COMMANDS[cmdName],
			indent: 3,
			conditions: [{ field: PREFIX.SHOW + "commands", value: 1 }],
		});
	});

	checkBox(PREFIX.SHOW + "ranks", "Show ranks configuration");

	Object.keys(RANKS).forEach(rank => {
		entries.push({
			name: PREFIX.RANK + rank,
			type: "string",
			title: `Group ID for rank -> ${rank}`,
			default: "",
			indent: 3,
			conditions: [{ field: PREFIX.SHOW + "ranks", value: 1 }],
		});
	});

	checkBox(PREFIX.SHOW + "regions", "Show regions configuration");

	Object.keys(REGIONS).forEach(regionName => {
		checkBox(PREFIX.REGION + REGIONS[regionName], regionName, false, {
			indent: 3,
			conditions: [{ field: PREFIX.SHOW + "regions", value: 1 }],
		});
	});

	checkBox(PREFIX.SHOW + "translation", "Show translation configuration");

	Object.keys(TRANSLATION).forEach(msgName => {
		entries.push({
			name: PREFIX.MSG + msgName,
			type: "string",
			title: `Message: ${TRANSLATION[msgName]}`,
			default: TRANSLATION[msgName],
			placeholder: TRANSLATION[msgName],
			indent: 3,
			conditions: [{ field: PREFIX.SHOW + "translation", value: 1 }],
		});
	});

	return entries;
}

function hiddenVariables() {
	const entries = [];

	function addVariable(name, value) {
		entries.push({
			name: `${name.toUpperCase()}`,
			type: "string",
			default: value,
			conditions: [{ field: "hidden", value: 1 }],
		});
	}

	addVariable("RANKS", RANKS);
	addVariable("REGIONS", REGIONS);
	addVariable("PREFIX", PREFIX);
	addVariable("COMMANDS", COMMANDS);
	addVariable("TRANSLATION", TRANSLATION);

	return entries;
}

registerPlugin(
	{
		name: "League Of TeamSpeak",
		version: "1.0.0",
		description: "League of Legends TeamSpeak Integration",
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
			...extendedConfig(),
			...hiddenVariables(),
		],
	},
	(_, config, { name, version, author }) => {
		/**
		 * Modules
		 */

		const backend = require("backend");
		const engine = require("engine");
		const http = require("http");
		const event = require("event");
		const store = require("store");

		const log = msg => !!config.logEnabled && engine.log(msg);

		/**
		 * Testing code
		 */

		//store.getKeys().forEach(keyName => store.unset(keyName));

		function showDB() {
			console.log(
				store.getKeys().map(keyName => {
					return {
						name: keyName,
						value: store.get(keyName),
					};
				})
			);
		}

		event.on("load", () => {
			/**
			 * Load libraries
			 */
			const command = require("command");
			if (!command) throw new Error("command.js library not found!");
			const nickDB = require("nickDatabase");
			if (!nickDB) throw new Error("nickDatabase.js library not found!");

			/* Load variables */

			const {
				RANKS,
				REGIONS,
				PREFIX,
				TRANSLATION,
				COMMANDS,
				API_KEY,
				RANK_DISPLAY_METHOD,
				GROUPS,
				GROUPS_BLACKLIST,
				VERIFICATION_TIME,
				REFRESH_ONLINE_INTERVAL,
			} = config;

			const QUEUE_TYPES = {
				SOLO: "RANKED_SOLO_5x5",
				FLEX: "RANKED_FLEX_SR",
			};

			let pauseCommands = false;

			/**
			 * CLASS: LoLAccount
			 * Core class for managing linked LoL account
			 */
			class LoLAccount {
				constructor(uid) {
					this.uid = uid;
					this.data = null;
				}

				// this should be run only at startup or once per day
				static async refreshSummoners() {
					log(`Refreshing summoners started, all commands paused!`);
					pauseCommands = true;

					for (const keyName of store.getKeys()) {
						if (!keyName.startsWith("lol")) continue;

						const uid = keyName.substring(3);
						const account = new LoLAccount(uid);

						log(`Refreshing: ${uid}`);

						if (!account.link) {
							log("Account data not found, deleting from database.");
							account.link = null;
							continue;
						}

						if (!account.isVerified()) {
							log("Account unverified.");
							if (!new Verification(uid).isPending()) {
								log("Deleting.");
								account.link = null;
								continue;
							} else {
								log("Verification pending, skipping.");
								continue;
							}
						}

						try {
							log(`Fetching..`);
							const { statusCode, status, data } = await LoLAccount.fetchSummoner(
								null,
								account.link.region,
								account.link.puuid
							);

							if (statusCode === 404) {
								log(`HTTP ${statusCode} Not Found - deleting from database.`);
								account.link = null;
								continue;
							}

							if (statusCode !== 200)
								throw new Error(`Unexpected HTTP status: ${statusCode} (${status})`);

							account.link = {
								...account.link,
								...JSON.parse(data),
							};
							log(`Summoner fetch was successful, data updated.`);

							if (!(await account.updateRank())) log(`Rank could not be updated.`);
							else log(`Rank updated successfully.`);
						} catch (err) {
							console.log(err, uid);
							continue;
						}
					}

					pauseCommands = false;
					log(`Refreshing summoners finished, commands unpaused!`);

					scheduleNextSummonersRefresh();
				}

				static async refreshOnlineRanks() {
					log(`Refreshing online clients ranks started, all commands paused!`);

					pauseCommands = true;

					for (const keyName of store.getKeys()) {
						if (!keyName.startsWith("lol")) continue;

						const uid = keyName.substring(3);
						const account = new LoLAccount(uid);

						if (!account.link) continue;
						if (!account.isVerified()) continue;
						log(`Refreshing rank of: ${uid}`);

						try {
							if (!(await account.updateRank())) log(`Rank could not be updated.`);
							else log(`Rank updated successfully.`);
						} catch (err) {
							console.log(err, uid);
							continue;
						}
					}
				}

				static isSummonerClaimed(searchPuuid) {
					log(`Checking if ${searchPuuid} is already claimed.`);

					const claimed =
						store.getKeys().filter(keyName => {
							if (keyName.startsWith("lol")) {
								const uid = keyName.substring(3);
								const account = new LoLAccount(uid);

								if (
									account.link &&
									account.link.puuid === searchPuuid &&
									account.link.verified === true
								)
									return true;
							}

							return false;
						}).length !== 0;

					log(`Claimed: ${claimed}`);

					return claimed;
				}

				/**
				 * Fetch summoner data by summoner name OR puuid & region, if puuid is provided -> use puuid endpoint
				 */
				static async fetchSummoner(summonerName, region, puuid = null) {
					try {
						const params = {
							headers: { "X-Riot-Token": API_KEY },
							method: "GET",
							timeout: 5 * 1000,
							url:
								puuid === null
									? `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/` +
									  encodeURI(summonerName)
									: `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/` +
									  encodeURI(puuid),
						};

						return await httpRequest(params);
					} catch (err) {
						console.log(err);
						return null;
					}
				}

				async updateRank() {
					try {
						log(`Updating rank for: ${this.uid}`);

						if (!this.link) throw new Error(`Can not update rank on a non existing account.`);
						if (!this.isVerified()) throw new Error(`Can not update rank for a non verified user.`);

						const rankData = await this.fetchRank();

						if (rankData === null)
							throw new Error("Can not update rank - received invalid rank data.");

						const rank = rankData.reduce((data, { queueType, tier, rank }) => {
							if (Object.values(QUEUE_TYPES).includes(queueType)) {
								data[queueType] = `${tier}${rank}`;
							}

							return data;
						}, {});

						this.link = {
							...this.link,
							rank,
						};

						return true;
					} catch (err) {
						console.log(err);
						return false;
					}
				}

				async fetchRank() {
					try {
						const params = {
							headers: { "X-Riot-Token": API_KEY },
							method: "GET",
							timeout: 5 * 1000,
							url:
								`https://${this.link.region}.api.riotgames.com/lol/league/v4/entries/by-summoner/` +
								encodeURI(this.link.id),
						};

						const { status, statusCode, data } = await httpRequest(params);

						if (statusCode !== 200) {
							throw new Error(`Unexpected status code: ${statusCode} (${status})`);
						}

						return JSON.parse(data);
					} catch (err) {
						console.log(err);
						return null;
					}
				}

				getRank() {
					try {
						const rankData = this.link.rank || {};
						const solo = rankData[QUEUE_TYPES.SOLO] || "UNRANKED";
						const flex = rankData[QUEUE_TYPES.FLEX] || "UNRANKED";

						let finalRank = null;

						if (RANK_DISPLAY_METHOD === "0") {
							const soloWeight = RANKS[solo];
							const flexWeight = RANKS[flex];

							finalRank = soloWeight > flexWeight ? solo : flex;
						} else if (RANK_DISPLAY_METHOD === "1") {
							finalRank = solo;
						} else if (RANK_DISPLAY_METHOD === "2") {
							finalRank = flex;
						}

						if (finalRank === null)
							throw new Error(
								`Receiving final rank was not handled correctly for user ${this.uid}`
							);

						return finalRank;
					} catch (err) {
						console.log(err);
						return null;
					}
				}

				get link() {
					if (this.data === null) {
						const data = store.get("lol" + this.uid) || false;
						this.data = data;
					}

					return this.data;
				}

				set link(data) {
					if (data === null) {
						new Verification(this.uid).end();
						store.unset("lol" + this.uid);
						this.data = null;
					} else {
						store.set("lol" + this.uid, data);
						this.data = data;
					}
				}

				isVerified() {
					return !!this.link.verified;
				}

				verify() {
					this.link = {
						...this.link,
						verified: true,
					};
				}
			}

			/**
			 * CLASS: Verification
			 * Handling account LoL verifications
			 */

			const VERIFY_TIMERS = {};

			class Verification {
				constructor(uid) {
					this.uid = uid;
				}

				begin() {
					VERIFY_TIMERS[this.uid] = {
						code: Math.random().toString(20).substring(2, 6),
						endAt: Date.now() + VERIFICATION_TIME * 1000,
					};

					return VERIFY_TIMERS[this.uid].code;
				}

				isPending() {
					const { endAt } = VERIFY_TIMERS[this.uid] || {};
					return endAt && endAt > Date.now();
				}

				end() {
					delete VERIFY_TIMERS[this.uid];
				}

				async check(account) {
					const code = VERIFY_TIMERS[this.uid].code;

					try {
						const params = {
							headers: { "X-Riot-Token": API_KEY },
							method: "GET",
							timeout: 5 * 1000,
							url:
								`https://${account.region}.api.riotgames.com/lol/platform/v4/third-party-code/by-summoner/` +
								encodeURI(account.id),
						};

						const { statusCode, status, data } = await httpRequest(params);

						if (statusCode !== 200) {
							if (statusCode !== 404) {
								throw new Error(`Unexpected status code: ${statusCode} (${status})`);
							}

							return false;
						}

						return code === JSON.parse(data);
					} catch (err) {
						console.log(err);
						return null;
					}
				}
			}

			/*
			 *
			 * COMMANDS
			 *
			 */
			const cmd = command
				.createCommandGroup(config[PREFIX.CMD + "main"])
				.help(
					"handles league of legends teamspeak integration, use [b]!man lol <command>[/b] for more information"
				)
				.exec((client, args, reply) => {
					reply(
						`Use [b]!man ` +
							config[PREFIX.CMD + "main"] +
							`[/b] or [b]!man ` +
							config[PREFIX.CMD + "main"] +
							` <subcommand>[/b] for more information`
					);
				});

			cmd
				.addCommand(config[PREFIX.CMD + "link"])
				.help("links your teamspeak account with your league of legends account")
				.manual("link teamspeak with league of legends")
				.manual("first argument is a region name, second one is your summoner name")
				.manual(`regions: ${Object.keys(REGIONS).join(", ")}`)
				.checkPermission(client => isClientAllowed(client))
				.addArgument(args =>
					args.string.setName("regionName").whitelist(Object.keys(REGIONS)).forceUpperCase()
				)
				.addArgument(args => args.rest.setName("summonerName", "summoner name").max(16))
				.exec(async (client, { regionName, summonerName }, reply) => {
					if (pauseCommands) return reply(translate("commandsPaused"));

					const uid = client.uid();
					const region = REGIONS[regionName];

					if (!isRegionAllowed(region)) return reply(translate("regionNotAllowed"));

					const account = new LoLAccount(uid);

					if (account.link) return reply(translate("accountAlreadyLinked"));

					const response = (await LoLAccount.fetchSummoner(summonerName, region)) || {};

					log(
						`Client ${client.nick()} is trying to link an account with summoner name: ${summonerName} (region: ${region})`
					);

					if (response.statusCode !== 200) {
						if (response.statusCode === 404) {
							log("Summoner name was not found!");
							return reply(translate("summonerNotFound"));
						} else {
							console.log(`Unexpected status code: ${response.statusCode} (${response.status})`);
							return reply(translate("error"));
						}
					}

					try {
						const data = JSON.parse(response.data);

						if (
							data !== null &&
							typeof data === "object" &&
							[data.id, data.accountId, data.puuid, data.name, data.summonerLevel].includes(
								undefined
							)
						)
							throw new Error("Received incorrect response object structure.");

						if (LoLAccount.isSummonerClaimed(data.puuid))
							return reply(translate("accountAlreadyClaimed"));

						log("Saving summoner.");

						account.link = { ...data, region };

						return reply(translate("accountLinked"));
					} catch (err) {
						log("Error during summoner data parsing..");
						console.log(err);
						return reply(translate("error"));
					}
				});

			cmd
				.addCommand(config[PREFIX.CMD + "unlink"])
				.help("unlinks your league of legends account")
				.manual("unlinks your league of legends account from your teamspeak account")
				// everyone should have access to unlink their accounts => no permission check
				.exec((client, args, reply) => {
					if (pauseCommands) return reply(translate("commandsPaused"));

					const uid = client.uid();
					const account = new LoLAccount(uid);
					if (!account.link) return reply(translate("accountNotLinked"));
					account.link = null;
					return reply(translate("accountUnlinked"));
				});

			cmd
				.addCommand(config[PREFIX.CMD + "verify"])
				.help("verifies your league of legends account")
				.checkPermission(client => isClientAllowed(client))
				.exec(async (client, args, reply) => {
					if (pauseCommands) return reply(translate("commandsPaused"));
					const uid = client.uid();
					const account = new LoLAccount(uid);

					if (!account.link) return reply(translate("accountNotLinked"));

					if (account.isVerified()) return reply(translate("accountAlreadyVerified"));
					if (LoLAccount.isSummonerClaimed(account.link.puuid))
						return reply(translate("accountAlreadyClaimed"));

					const verification = new Verification(uid);

					if (!verification.isPending()) {
						const code = verification.begin();
						return reply(translate("verificationCode").replace("%code%", code));
					}

					const success = await verification.check(account.link);

					if (!success) {
						if (success === null) reply(translate("error"));
						else reply(translate("verificationInvalid"));
						return verification.end();
					}

					account.verify();
					await account.updateRank();

					return reply(translate("verificationSuccessful"));
				});

			/* Functions */

			function isClientAllowed(client) {
				if (!GROUPS || GROUPS.length === 0) return true;

				const clientGroups = client.getServerGroups().map(g => g.id());
				return GROUPS_BLACKLIST
					? clientGroups.every(gID => !GROUPS.includes(gID)) // blacklist
					: clientGroups.some(gID => GROUPS.includes(gID)); // whitelist
			}

			function isRegionAllowed(region) {
				return config[PREFIX.REGION + region] === true;
			}

			function translate(msgName) {
				return config[PREFIX.MSG + msgName];
			}

			function httpRequest(params) {
				return new Promise((resolve, reject) => {
					http.simpleRequest(params, (error, response) => {
						if (error) reject(error);
						else resolve(response);
					});
				});
			}

			/* Initializing refreshing intervals */

			function scheduleNextSummonersRefresh() {
				const nextRefreshDate = new Date();
				nextRefreshDate.setDate(nextRefreshDate.getDate() + 1);
				nextRefreshDate.setHours(3, 0, 0, 0);
				const tillNextRefreshInMs = nextRefreshDate.getTime() - Date.now();

				setTimeout(LoLAccount.refreshSummoners, tillNextRefreshInMs);
				log(
					`Scheduled next summoners refresh in ${(tillNextRefreshInMs / (60 * 60 * 1000)).toFixed(
						1
					)} hours.`
				);
			}

			scheduleNextSummonersRefresh();

			setInterval(
				() => LoLAccount.refreshOnlineRanks(),
				REFRESH_ONLINE_INTERVAL >= 30 ? REFRESH_ONLINE_INTERVAL * 1000 * 60 : 30 * 1000 * 60
			);

			engine.log(`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`);
		});
	}
);
