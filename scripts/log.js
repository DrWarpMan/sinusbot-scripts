registerPlugin(
	{
		name: "Log",
		version: "2.0.0",
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

		/**
		 * @typedef {keyof typeof LOG_LEVEL} LogLevel
		 */

		const LOG_LEVEL = /** @type {const} */ ({
			ERROR: 0,
			WARN: 1,
			INFO: 2,
		});

		/**
		 * @param {number} logLevel
		 * @returns {LogLevel}
		 */
		const getLogLevelFromInteger = (logLevel) => {
			switch (logLevel) {
				case LOG_LEVEL.ERROR:
					return "ERROR";
				case LOG_LEVEL.WARN:
					return "WARN";
				case LOG_LEVEL.INFO:
					return "INFO";
				default:
					throw new Error("Invalid log level!");
			}
		};

		/**
		 * @param {{
		 * 	engine: typeof import("engine"),
		 * 	logLevel: LogLevel | number | `${number}`
		 * }} params
		 * @returns {(logLevel: LogLevel, message: string) => void}
		 */
		const createLogger = (params) => {
			/** @type {LogLevel} */
			let loggerLogLevel;

			if (
				typeof params.logLevel === "string" &&
				/^[0-9]+$/.test(params.logLevel)
			) {
				loggerLogLevel = getLogLevelFromInteger(Number(params.logLevel));
			} else if (typeof params.logLevel === "number") {
				loggerLogLevel = getLogLevelFromInteger(params.logLevel);
			} else if (params.logLevel in LOG_LEVEL) {
				loggerLogLevel = /** @type {LogLevel} */ (params.logLevel);
			} else {
				throw new Error("Invalid log level!");
			}

			return (logLevel, message) => {
				if (LOG_LEVEL[logLevel] > LOG_LEVEL[loggerLogLevel]) return;
				engine.log(`${logLevel}: ${message}`);
			};
		};

		module.exports = createLogger;

		engine.log(`Loaded: ${name} | v${version} | ${author}`);
	},
);
