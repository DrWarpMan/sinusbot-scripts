registerPlugin(
	{
		name: "Log",
		version: "1.0.0",
		description: "Simple logging library",
		author: "DrWarpMan <drwarpman@gmail.com>",
		backends: ["ts3", "discord"],
		engine: ">= 1.0",
		autorun: true,
		enableWeb: false,
		hidden: false,
		requiredModules: [],
		voiceCommands: [],
		vars: [],
	},
	(_, __, { name, version, author }) => {
		const engine = require("engine");

		const LOG_LEVEL = /** @type {const} */ ({
			"ERROR": 0,
			"WARN": 1,
			"INFO": 2
		});

		/**
		 * Creates & returns a new instance of logger
		 * @param {typeof engine} engine the engine instance of the script that uses this library
		 * @param {keyof typeof LOG_LEVEL | number} configLogLevel script's log level, usually set by the user of the script
		 * @returns {(logLevel: keyof typeof LOG_LEVEL, message: string) => void} function that creates a log with specified log level
		 */

		const logger = (engine, configLogLevel) => {			
			if(typeof configLogLevel === "number")
			{
				const [logLevel] = /** @type {[keyof typeof LOG_LEVEL, number][]} */
					(Object.entries(LOG_LEVEL)).find(([_, num]) => num === configLogLevel);

				if(logLevel) configLogLevel = logLevel;
				else throw new Error("Invalid log level provided.");
			}

			return (logLevel, message) => {
				if(LOG_LEVEL[logLevel] > LOG_LEVEL[configLogLevel]) return;
				engine.log(`${logLevel}: ${message}`);
			};
		};

		module.exports = logger;

		engine.log(`Loaded: ${name} | v${version} | ${author}`);
	}
);
