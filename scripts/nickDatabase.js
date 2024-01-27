registerPlugin(
	{
		name: "Nick Database",
		version: "1.0.1",
		description:
			"Script that will save nicknames for each client, to load them later whilst client's are offline!",
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
				name: "logEnabled",
				type: "checkbox",
				title: "Check to enable detailed logs",
				default: false,
			},
		],
	},
	(_, config, { name, version, author }) => {
		const engine = require("engine");
		const store = require("store");
		const event = require("event");

		const log = msg => !!config.logEnabled && engine.log(msg);

		event.on("clientNick", (client, _) => saveNick(client));
		event.on("clientVisible", ({ client }) => saveNick(client));

		function getNick(uid) {
			log(`Grabbing nick of: ${uid}`);
			return store.get(uid) || false;
		}

		function saveNick(client) {
			log(`Saving nick of: ${client.uid()} (${client.nick()})`);
			return store.set(client.uid(), client.nick());
		}

		module.exports = {
			getNick,
		};

		engine.log(
			`\n[LOADED] Script: "${name}" Version: "${version}" Author: "${author}"`
		);
	}
);
