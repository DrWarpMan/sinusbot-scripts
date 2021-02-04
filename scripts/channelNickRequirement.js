registerPlugin({
    name: "Channel Nick Requirement",
    version: "1.0.0",
    description: "Allow only people with specific nickname format to join a channel",
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
        name: "ignoredGroupIDs",
        type: "strings",
        title: "Ignored group IDs:",
        default: []
    }, {
        name: "channels",
        type: "array",
        title: "Channels:",
        default: [],
        vars: [{
            name: "channelID",
            type: "string",
            title: "Channel ID:",
            placeholder: "69"
        }, {
            name: "nickRegex",
            type: "string",
            title: "Nick regex:",
            placeholder: ""
        }, {
            name: "kickType",
            type: "select",
            title: "Kick type:",
            options: ["From server", "From channel"]
        }, {
            name: "kickMsg",
            type: "string",
            title: "Kick message:",
            placeholder: "Invalid nickname!"
        }]
    }]
}, (_, config, { name, version, author }) => {

    const engine = require("engine");
    const event = require("event");

    const { ignoredGroupIDs, logEnabled } = config;
    let { channels } = config;

    // Make regexps, filter invalid rules
    channels = channels.map(channelData => {
        const capture = channelData.nickRegex.match(/^[ ]{0,}\/(.{1,})\/([gmixXsuUAJ]{0,10})[ ]{0,}$/i); // Multivitamin's regex code

        try {
            if (!capture) {
                logMsg(`WARN: Incorrect regexp (${channelData.nickRegex}), trying to use it anyway..`);
                channelData.nickRegex = new RegExp(channelData.nickRegex, "i");
            } else {
                channelData.nickRegex = new RegExp(capture[1], capture[2]);
                logMsg(`INFO: Regexp ${channelData.nickRegex} valid!`);
            }
        } catch (err) {
            logMsg(`ERROR: Invalid regex found (${channelData.nickRegex})!`);
            channelData.nickRegex = false;
        } finally {
            return channelData;
        }
    });

    event.on("clientMove", ({ client, toChannel, invoker }) => {
        if (client.isSelf()) return;
        if (invoker && invoker.isSelf()) return; // ?

        if (!isIgnored(client)) {
            let data = isChannel(toChannel);

            if (data) {
                const { channelID, nickRegex, kickType } = data;
                const kickMsg = data.kickMsg ? data.kickMsg.substring(0, 80) : ""; // 80 max length of kick msg

                logMsg(`Checking client ${client.nick()} in channel ${channelID}`);
                if (nickRegex === false) return logMsg(`Invalid regex, can not proceed!`);

                const match = client.nick().match(nickRegex);
                if (match === null) {
                    if (kickType == 1)
                        client.kickFromChannel(kickMsg);
                    else
                        client.kickFromServer(kickMsg);
                } else logMsg(`Valid client!`);
            } else logMsg(`Channel ID ${toChannel.id()} is not in the config!`);
        } else logMsg(`Client ${client.nick()} is ignored!`);
    });

    function isIgnored(client) {
        return client.getServerGroups().map(g => g.id()).some(gID => ignoredGroupIDs.includes(gID));
    }

    function isChannel(channel) {
        const joinedChannelID = channel.id();

        return channels.find(({ channelID }) => {
            return joinedChannelID === channelID;
        });
    }

    function logMsg(msg) {
        return !!logEnabled && engine.log(msg);
    }

    // SCRIPT LOADED SUCCCESFULLY
    engine.log(`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`);
});