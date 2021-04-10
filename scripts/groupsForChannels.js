registerPlugin({
    name: "Groups For Channels",
    version: "1.0.0",
    description: "Add or remove groups when a client joins/leaves a channel(s)",
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
        name: "channels",
        type: "array",
        title: "Channel list:",
        default: [],
        vars: [{
            name: "channelID",
            type: "string",
            title: "Channel ID",
        }, {
            name: "groupID",
            type: "string",
            title: "Group ID",
        }, {
            name: "requiredGroupIDs",
            type: "strings",
            title: "Required Group IDs (client needs at least one of these)",
        }]
    }]
}, (_, config, { name, version, author }) => {

    const engine = require("engine");
    const event = require("event");

    engine.log(`\n[LOADING] Script: "${name}" Version: "${version}" Author: "${author}"`);

    const log = msg => !!config.logEnabled && engine.log(msg);

    const { channels } = config;
    const CHANNELS = {};

    (channels || []).forEach(({ channelID, groupID, requiredGroupIDs }) => {
        CHANNELS[channelID] = {
            groupID,
            requiredGroupIDs
        }
    });

    log(`Configuration: ${JSON.stringify(CHANNELS)}`);

    if (Object.keys(CHANNELS).length > 0) {
        event.on("clientMove", ({ client, toChannel, fromChannel }) => {
            let clientGroups = false;
            let channelID;
            let data;

            // if switched FROM CHANNEL or DISCONNECTED
            if (fromChannel) {
                channelID = fromChannel.id();
                data = CHANNELS[channelID];

                // if left a channel from config
                if (data) {
                    log(`${client.nick()} has left the channel from the config!`);
                    const { groupID } = data;
                    clientGroups = client.getServerGroups().map(g => g.id());

                    manageGroup(client, clientGroups, groupID, "remove");
                    log(`${client.nick()} has been removed from the group ${groupID}!`);
                }
            }

            // if switched TO CHANNEL or CONNECTED
            if (toChannel) {
                channelID = toChannel.id();
                data = CHANNELS[channelID];

                // if joined a channel from config
                if (data) {
                    log(`${client.nick()} has joined the channel from the config!`);
                    const { groupID, requiredGroupIDs } = data;
                    // if groups were already loaded before, read them
                    clientGroups = (!clientGroups) ? client.getServerGroups().map(g => g.id()) : clientGroups;

                    // if no required groups OR is in required groups
                    if ((requiredGroupIDs || []).length <= 0 || similarGroups(clientGroups, requiredGroupIDs)) {
                        manageGroup(client, clientGroups, groupID, "add");
                        log(`${client.nick()} has been added to the group ${groupID}!`);
                    } else log(`${client.nick()} no permission to get this group ${groupID}!`);
                }
            }
        });
    } else log(`No configuration found, therefore script is useless!`);

    function similarGroups(groups1, groups2) {
        return groups1.some(gID => groups2.includes(gID));
    }

    function manageGroup(client, clientGroups, groupID, method) {
        if (method === "add" && !clientGroups.includes(groupID))
            client.addToServerGroup(groupID);
        else if (method === "remove" && clientGroups.includes(groupID))
            client.removeFromServerGroup(groupID);
    }

    engine.log(`\n[SUCCESS] Script: "${name}" Version: "${version}" Author: "${author}"`);
});