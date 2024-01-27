registerPlugin(
	{
		name: "Nick Database",
		version: "1.0.2",
		description: "Save last seen nicknames of clients, to be available even if offline.",
		author: "DrWarpMan <drwarpman@gmail.com>",
		backends: ["ts3"],
		engine: ">= 1.0",
		autorun: true,
		enableWeb: false,
		hidden: false,
		requiredModules: [],
		voiceCommands: [],
		vars: [
			{
				name: "logLevel",
				type: "select",
				title: "Log Level:",
				options: ["ERROR", "WARN", "INFO"],
				default: "0",
			},
		],
	},
	(_, config, { name, version, author }) => {
		const engine = require("engine");
		const store = require("store");
		const event = require("event");

		event.on("load", () => {
			// Libraries

			const createLogger = require("log");
			if(!createLogger) throw new Error("Log library not found!");
			const log = createLogger({
				engine,
				logLevel: config.logLevel,
			});

			event.on("clientNick", (client) => saveNick(client));
			event.on("clientVisible", ({ client }) => saveNick(client));

			/** @param {string} uid */
			const getNick = (uid) => {
				return store.get(uid) || "";
			}
	
			/** @param {Client} client */
			const saveNick = (client) => {
				const nick = client.nick();
				const uid = client.uid();
				
				store.set(uid, nick);

				log("INFO", `Saved nick ${nick} for ${uid}`);
			}

			module.exports = {
				getNick,
			};

			engine.log(`Loaded: ${name} | v${version} | ${author}`);
		});
	},
);
