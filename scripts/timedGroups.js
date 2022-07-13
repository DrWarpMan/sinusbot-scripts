registerPlugin(
	{
		name: "Timed Groups",
		version: "1.0.0",
		description:
			"Automatically remove assigned group after specific amount of time",
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
			{
				name: "groups",
				type: "array",
				title: "List of all groups & their removal times:",
				vars: [
					{
						name: "groupID",
						type: "string",
						title: "Group ID:",
					},
					{
						name: "time",
						type: "number",
						title: "Time (in minutes):",
					},
				],
			},
		],
	},
	(_, config, { name, version, author }) => {
		const engine = require("engine");
		const backend = require("backend");
		const event = require("event");
		const store = require("store");

		const log = msg => !!config.logEnabled && engine.log(msg);

		// Variables

		const { groups } = config;

		if (!groups || groups.length <= 0)
			return log("No configuration = no reason to continue.");

		setInterval(checkGroups, 30 * 1000);

		function checkGroups() {
			if (!backend.isConnected()) return;

			store.getKeys().forEach(keyName => {
				const addedGroupID = keyName.split(" ")[0];
				const clientUID = keyName.split(" ")[1];

				const { time } =
					groups.find(({ groupID }) => groupID === addedGroupID) || {};

				if (time) {
					const client = backend.getClientByUID(clientUID);

					if (client) {
						const group = backend.getServerGroupByID(addedGroupID);

						if (group) {
							const dateGroupAdded = parseInt(store.get(keyName));
							const endDate = dateGroupAdded + time * 60 * 1000;
							const nowDate = Date.now();

							if (endDate <= nowDate) {
								client.removeFromServerGroup(group);
								store.unset(keyName);
								log(
									`Group ${addedGroupID} was removed! (END DATE: ${endDate} <= NOW: ${nowDate})`
								);
							} else {
								log(
									`Group ${addedGroupID} was NOT removed! (END DATE: ${endDate} > NOW: ${nowDate})`
								);
							}
						} else {
							log(`Group ${addedGroupID} could not be find, deleting record..`);
							store.unset(keyName);
						}
					} else {
						log(
							`Client ${clientUID} is offline, can not continue with this client.`
						);
					}
				} else {
					log(
						`Group ${addedGroupID} is no longer in configuration, deleting record..`
					);
					store.unset(keyName);
				}
			});
		}

		event.on("clientMove", ({ fromChannel, client }) => {
			// just connected
			if (!fromChannel) {
				const clientGroups = client.getServerGroups().map(g => g.id());

				clientGroups.forEach(gID => {
					const isInConfig = groups.find(({ groupID }) => groupID === gID);

					if (isInConfig) {
						if (!store.get(`${gID} ${client.uid()}`)) {
							store.set(`${gID} ${client.uid()}`, Date.now());
						}
					}
				});
			}
		});

		event.on("serverGroupAdded", ({ serverGroup, client }) => {
			const addedGroupID = serverGroup.id();
			const isInConfig = groups.find(({ groupID }) => groupID === addedGroupID);

			if (isInConfig) {
				store.set(`${addedGroupID} ${client.uid()}`, Date.now());
			}
		});

		event.on("serverGroupRemoved", ({ serverGroup, client }) => {
			const removedGroupID = serverGroup.id();
			const isInConfig = groups.find(
				({ groupID }) => groupID === removedGroupID
			);

			if (isInConfig) store.unset(`${removedGroupID} ${client.uid()}`);
		});

		engine.log(
			`\n[LOADED] Script: "${name}" Version: "${version}" Author: "${author}"`
		);
	}
);
