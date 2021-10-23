registerPlugin(
	{
		name: "Online Clients in Server Name",
		version: "1.0.0",
		description:
			"Shows amount of maximum and currently online clients in server name",
		author: "DrWarpMan <drwarpman@gmail.com>",
		backends: ["ts3"],
		engine: ">= 1.0",
		autorun: false,
		enableWeb: false,
		hidden: false,
		requiredModules: [],
		vars: [
			{
				name: "serverName",
				type: "string",
				title: "Server name [Placeholders: %online%, %max%, %percentage%]:",
			},
			{
				name: "serverPort",
				type: "string",
				title: "Server [Port]",
			},
			{
				name: "queryIP",
				type: "string",
				title: "Query [Host]",
			},
			{
				name: "queryUser",
				type: "string",
				title: "Query [User]",
			},
			{
				name: "queryPassword",
				type: "password",
				title: "Query [Password]",
			},
			{
				name: "queryPort",
				type: "string",
				title: "Query [Port]",
			},
			{
				name: "ignoreGroupIDs",
				type: "strings",
				title: "Ignore Group IDs:",
			},
		],
		voiceCommands: [],
	},
	(_, config, { name, version, author }) => {
		const engine = require("engine");
		const event = require("event");
		const backend = require("backend");

		let maxClients = 0;

		event.on("load", function () {
			// @ts-ignore
			let ServerQuery = require("ServerQuery.js");
			if (typeof ServerQuery !== "function")
				return engine.log(
					"This Script requires to have ServerQuery.js library installed!"
				);

			let ts3 = new ServerQuery({
				host: config.queryIP,
				port: parseInt(config.queryPort) || 10011,
			});

			if (!ts3) return engine.log("Query connection error!");

			ts3.on("connect", function () {
				engine.log("TS3 query connected!");
				ts3.send(
					"login",
					[config.queryUser || "serveradmin", config.queryPassword],
					function (err) {
						if (err) return engine.log("Query Error: " + JSON.stringify(err));

						ts3.send(
							"use",
							{ port: config.serverPort || 9987 },
							function (err) {
								if (err)
									return engine.log("Query Error: " + JSON.stringify(err));
								setInterval(() => ts3.send("whoami", _err => {}), 60 * 1000);
							}
						);
					}
				);
			});

			event.on("serverinfo_int", serverinfo => {
				maxClients = JSON.parse(serverinfo).maxClients;
			});

			event.on("clientMove", function (_ev) {
				changeName();
			});

			function changeName() {
				backend.extended().requestExtendedServerInfo();

				let onlineCount = backend
					.getClients()
					.filter(client => isNotIgnored(client)).length;

				ts3.send(
					"serveredit",
					{
						virtualserver_name: config.serverName
							.replace("%max%", maxClients)
							.replace("%online%", onlineCount)
							.replace(
								"%percentage%",
								Math.floor(onlineCount / (maxClients / 100))
							),
					},
					function (err, _res) {
						if (err) return engine.log("Query Error: " + JSON.stringify(err));
					}
				);
			}
		});

		function isNotIgnored(client) {
			if (
				config.ignoreGroupIDs == undefined ||
				config.ignoreGroupIDs.length <= 0
			)
				return true;

			let clientGroupIDs = client.getServerGroups().map(g => g.id());
			return !checkArrays(clientGroupIDs, config.ignoreGroupIDs);
		}

		function checkArrays(arr1, arr2) {
			return arr2.some(item => arr1.includes(item));
		}

		// SCRIPT LOADED SUCCCESFULLY
		engine.log(
			`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`
		);
	}
);
