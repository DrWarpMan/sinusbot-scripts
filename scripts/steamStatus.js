registerPlugin(
	{
		name: "Steam Status",
		version: "2.0.0",
		description: "Shows Steam status of Steam users in specified channels",
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
				name: "showDefaultStatusConfiguration",
				type: "checkbox",
				title: "Show default status configuration",
				default: false,
			},
			{
				name: "status_offline",
				type: "string",
				title: "[Default] Status Text Offline:",
				placeholder: "User %nick% is offline",
				default: "User %nick% is offline",
				conditions: [{ field: "showDefaultStatusConfiguration", value: 1 }],
			},
			{
				name: "status_online",
				type: "string",
				title: "[Default] Status Text - Online:",
				placeholder: "User %nick% is online",
				default: "User %nick% is online",
				conditions: [{ field: "showDefaultStatusConfiguration", value: 1 }],
			},
			{
				name: "status_busy",
				type: "string",
				title: "[Default] Status Text - Busy:",
				placeholder: "User %nick% is busy",
				default: "User %nick% is busy",
				conditions: [{ field: "showDefaultStatusConfiguration", value: 1 }],
			},
			{
				name: "status_away",
				type: "string",
				title: "[Default] Status Text - Away:",
				placeholder: "User %nick% is away",
				default: "User %nick% is away",
				conditions: [{ field: "showDefaultStatusConfiguration", value: 1 }],
			},
			{
				name: "status_snooze",
				type: "string",
				title: "[Default] Status Text - Snooze:",
				placeholder: "User %nick% is sleeping",
				default: "User %nick% is sleeping",
				conditions: [{ field: "showDefaultStatusConfiguration", value: 1 }],
			},
			{
				name: "status_ltt",
				type: "string",
				title: "[Default] Status Text - Looking to trade:",
				placeholder: "User %nick% is looking to trade",
				default: "User %nick% is looking to trade",
				conditions: [{ field: "showDefaultStatusConfiguration", value: 1 }],
			},
			{
				name: "status_ltp",
				type: "string",
				title: "[Default] Status Text - Looking to play:",
				placeholder: "User %nick% is looking to play",
				default: "User %nick% is looking to play",
				conditions: [{ field: "showDefaultStatusConfiguration", value: 1 }],
			},
			{
				name: "status_playing",
				type: "string",
				title: "[Default] Status Text - Playing:",
				placeholder: "User %nick% is playing %game%",
				default: "User %nick% is playing %game%",
				conditions: [{ field: "showDefaultStatusConfiguration", value: 1 }],
			},
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
						name: "status_offline",
						type: "string",
						title: "[Custom] Status Text Offline:",
						placeholder: "User %nick% is offline",
					},
					{
						name: "status_online",
						type: "string",
						title: "[Custom] Status Text - Online:",
						placeholder: "User %nick% is online",
						default: "User %nick% is online"
					},
					{
						name: "status_busy",
						type: "string",
						title: "[Custom] Status Text - Busy:",
						placeholder: "User %nick% is busy",
						default: "User %nick% is busy",
					},
					{
						name: "status_away",
						type: "string",
						title: "[Custom] Status Text - Away:",
						placeholder: "User %nick% is away",
						default: "User %nick% is away",
					},
					{
						name: "status_snooze",
						type: "string",
						title: "[Custom] Status Text - Snooze:",
						placeholder: "User %nick% is sleeping",
						default: "User %nick% is sleeping",
					},
					{
						name: "status_ltt",
						type: "string",
						title: "[Custom] Status Text - Looking to trade:",
						placeholder: "User %nick% is looking to trade",
						default: "User %nick% is looking to trade",
					},
					{
						name: "status_ltp",
						type: "string",
						title: "[Custom] Status Text - Looking to play:",
						placeholder: "User %nick% is looking to play",
						default: "User %nick% is looking to play",
					},
					{
						name: "status_playing",
						type: "string",
						title: "[Custom] Status Text - Playing:",
						placeholder: "User %nick% is playing %game%",
						default: "User %nick% is playing %game%",
					},
				]
			}
		],
	},
	(_, config, { name, version, author }) => {
		const engine = require("engine");
		const http = require("http");
		const backend = require("backend");

		const log = msg => !!config.logEnabled && engine.log(msg);

		// Variables

		const { APIKey, steamUsers } = config;

		let checkInterval = parseInt(config.checkInterval);
		if (checkInterval < 1) {
			checkInterval = 1;
			log("Check Interval was set too low, setting back to 1 minute.");
		}

		/*
            Source: https://developer.valvesoftware.com/wiki/Steam_Web_API#GetPlayerSummaries
            0 - Offline,
            1 - Online, 
            2 - Busy, 
            3 - Away,
            4 - Snooze, 
            5 - Looking to trade, 
            6 - Looking to play,
            7 - Playing (custom)
        */
		const StatusEnum_ish = {
			0: "offline",
			1: "online",
			2: "busy",
			3: "away",
			4: "snooze",
			5: "ltt",
			6: "ltp",
			7: "playing",
		};

		const CHANNEL_NAME_LENGTH = 40;

		async function checkSteamUsers() {
			if (!backend.isConnected()) {
				log("Backend not connected, skipping check.");
				return;
			}

			for (const steamUser of steamUsers) {
				log(`Checking ${steamUser.steamID64} (ch: ${steamUser.channelID})`);

				const channel = backend.getChannelByID(steamUser.channelID);
				if (!channel) {
					log(`Channel with ID ${steamUser.channelID} not found, skipping user.`);
					continue;
				}

				try {
					const { statusCode, data: body } = await GetPlayerSummaries(steamUser.steamID64);
					const response = JSON.parse(body.toString());

					if (statusCode === 200) {
						const { response: { players } } = response;

						const playerSummary = players[0];

						const { personaname: nick = "", gameextrainfo: game = "" } = playerSummary;
						let { personastate: status = 0 } = playerSummary;

						if (game) status = 7;

						log(`Status: ${status}`);

						const statusText =
                            steamUser[`status_${StatusEnum_ish[status]}`]
                            || config[`status_${StatusEnum_ish[status]}`]
                            || "";


						let channelName = statusText.replace("%game%", game).replace("%nick%", nick);
						let overflow = CHANNEL_NAME_LENGTH - channelName.length;
						if (overflow < 0) {
							overflow = Math.abs(overflow);
							log(`Channel name would overflow (${overflow}): ${channelName}, shortening..`);
							channelName = channelName.substring(0, channelName.length - overflow);
						}

						if (channelName.length <= 0) {
							log("Channel name resulted to be empty? Skipping user.");
							continue;
						}

						log(`Channel name: ${channelName}`);
						channel.setName(channelName);
					} else {
						throw new Error(
							`GetPlayerSummaries - Status Code: ${statusCode} Message: ${response.error || "Unknown"}`
						);
					}
				} catch (err) {
					console.log(err);
					log("Error ocurred, skipping user.");
					continue;
				}
			}
		}

		setInterval(checkSteamUsers, checkInterval * 60 * 1000);

		const GetPlayerSummaries = (steamID64) => {
			return httpRequest({
				method: "GET",
				url: "http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/"
                    + `?key=${APIKey}`
                    + `&steamids=${steamID64}`,
				timeout: 5000,
			});
		};

		const httpRequest = (config) => {
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
		};

		engine.log(
			`\n[LOADED] Script: "${name}" Version: "${version}" Author: "${author}"`
		);
	}
);
