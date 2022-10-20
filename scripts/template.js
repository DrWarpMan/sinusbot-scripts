registerPlugin(
	{
		name: "Template",
		version: "0.1.0",
		description: "Template description",
		author: "DrWarpMan <drwarpman@gmail.com>",
		backends: ["ts3"],
		engine: ">= 1.0",
		autorun: false,
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

		// eslint-disable-next-line no-unused-vars
		const log = msg => !!config.logEnabled && engine.log(msg);

		// Variables

		engine.log(
			`\n[LOADED] Script: "${name}" Version: "${version}" Author: "${author}"`
		);
	}
);
