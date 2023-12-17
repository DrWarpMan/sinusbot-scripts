registerPlugin({
    name: "Anti-Poke Group",
    version: "1.0.0",
    description: "Assigns anti-poke group via a command",
    author: "DrWarpMan <drwarpman@gmail.com>",
    backends: ["ts3"],
    engine: ">= 1.0",
    autorun: false,
    enableWeb: false,
    hidden: false,
    requiredModules: [],
    voiceCommands: [],
    vars: [{
        name: "logEnabled",
        type: "checkbox",
        title: "Check to enable detailed logs",
        default: false
    }, {
        name: "command",
        type: "string",
        title: "Anti-Poke Command:",
        default: "!antipoke",
        placeholder: "!antipoke"
    }, {
        name: "groupID",
        type: "string",
        title: "Anti-Poke Group ID:",
        default: 0,
        placeholder: "123"
    }, {
        name: "allowedGroupIDs",
        type: "strings",
        title: "List of groups allowed to assign anti-poke group:",
        default: []
    }]
}, (_, config, { name, version, author }) => {

    const engine = require("engine");
    const event = require("event");
    const backend = require("backend");

    engine.log(`\n[LOADING] Script: "${name}" Version: "${version}" Author: "${author}"`);

    const log = msg => !!config.logEnabled && engine.log(msg);
    const { command, groupID, allowedGroupIDs } = config;

    event.on("chat", ({ client, text }) => {
        if (text.toLowerCase().startsWith(command)) {
            log(`${client.nick()} is trying to use antipoke!`);
            const groups = client.getServerGroups().map(g => g.id());

            if (isAllowed(groups)) {
                assignAntiPoke(client, groups);
            } else log(`${client.nick()} is not allowed to use antipoke!`);
        }
    });

    function isAllowed(clientGroups) {
        if (allowedGroupIDs.length <= 0) return true;
        return clientGroups.some(gID => allowedGroupIDs.includes(gID));
    }

    function assignAntiPoke(client, clientGroups) {
        const antiPokeGroup = backend.getServerGroupByID(groupID);
        if (antiPokeGroup)
            if (!clientGroups.includes(groupID)) {
                client.addToServerGroup(antiPokeGroup);
                log(`${client.nick()} got added antipoke!`);
            } else {
                client.removeFromServerGroup(antiPokeGroup);
                log(`${client.nick()} got removed antipoke!`);
            }
        else log(`Group with ID: ${groupID} not found!`);
    }

    engine.log(`\n[SUCCESS] Script: "${name}" Version: "${version}" Author: "${author}"`);
});