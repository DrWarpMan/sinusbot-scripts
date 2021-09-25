registerPlugin(
	{
		name: "Icon System",
		version: "1.0.0",
		description: "Lets user manage their custom icons",
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
				name: "commandIcon",
				type: "string",
				title: 'Icon command [Default: "!icon"]:',
				default: "!icon",
				placeholder: "!icon",
			},
			{
				name: "limitDefault",
				type: "number",
				title: "Default icon limit:",
				default: 3,
				placeholder: "3",
			},
			{
				name: "vipGroupID",
				type: "number",
				title: "VIP Group ID:",
				placeholder: "69",
			},
			{
				name: "limitVIP",
				type: "number",
				title: "VIP icon limit:",
				default: 5,
				placeholder: "5",
				indent: 3,
			},
			{
				name: "extraVipGroupID",
				type: "number",
				title: "Extra-VIP Group ID:",
				placeholder: "69",
			},
			{
				name: "limitExtraVIP",
				type: "number",
				title: "Extra-VIP icon limit:",
				default: 10,
				placeholder: "10",
				indent: 3,
			},
			{
				name: "blacklistGroups",
				type: "strings",
				title: "Blacklist group list:",
				default: [],
			},
			{
				name: "icons",
				type: "strings",
				title: "Icon names list:",
				default: [],
			},
		],
	},
	(_, config, { name, version, author }) => {
		const engine = require("engine");
		const event = require("event");
		const backend = require("backend");

		engine.log(
			`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`
		);

		const {
			commandIcon,
			limitDefault,
			vipGroupID,
			limitVIP,
			extraVipGroupID,
			limitExtraVIP,
			blacklistGroups,
			icons,
			logEnabled,
		} = config;

		if (!icons || icons.length <= 0) return logMsg("No icons configured!");

		event.on("chat", ({ client, text, mode }) => {
			const msg = text
				.split(" ")
				.filter(i => /\s/.test(i) === false && i.length > 0);
			const command = msg[0].toLowerCase();
			const args = msg.slice(1);

			if (client.isSelf()) return;
			if (mode != 1) return;

			if (command === commandIcon) {
				const iconName = args.join(" ");

				if (!iconName || iconName.length <= 0)
					return client.chat(`Icon list: [b]${icons.join("[i],[/i] ")}[/b]`);

				if (icons.includes(iconName)) {
					const group = backend
						.getServerGroups()
						.find(g => g.name() === iconName);
					if (!group) return client.chat("Error, contact admin!");

					const groupHas = client
						.getServerGroups()
						.map(g => g.id())
						.includes(group.id());

					if (groupHas) client.removeFromServerGroup(group);
					else {
						const iconLimit = getIconLimit(client);
						const iconAmount = getIconAmount(client);

						if (iconAmount >= iconLimit)
							return client.chat("Icon limit reached!");

						client.addToServerGroup(group);
					}
				} else client.chat("Invalid icon name!");
			}
		});

		function getIconLimit(client) {
			const groups = client.getServerGroups().map(g => g.id());

			if (groups.some(gID => extraVipGroupID == gID)) return limitExtraVIP;
			else if (groups.some(gID => vipGroupID == gID)) return limitVIP;
			else if (groups.some(gID => (blacklistGroups || []).includes(gID)))
				return 0;

			return limitDefault;
		}

		function getIconAmount(client) {
			const groups = client.getServerGroups().map(g => g.name());
			let amount = 0;

			groups.forEach(gName => {
				if (icons.includes(gName)) amount++;
			});

			return amount;
		}

		function logMsg(msg) {
			return !!logEnabled && engine.log(msg);
		}
	}
);
