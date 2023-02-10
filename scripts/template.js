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
		const event = require("event");

		event.on("load", () => {
			// Libraries

			const logger = require("log");
			if(!logger) throw new Error("Log library not found!");
			const log = logger(engine, parseInt(config.logLevel));

			engine.log(`Loaded: ${name} | v${version} | ${author}`);
		});
	}
);
