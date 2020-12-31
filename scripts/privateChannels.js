registerPlugin({
    name: "Private Channels",
    version: "1.0.0",
    description: "Create channels for your clients easily, or rather let them make it by themselves!",
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
        name: "joinChannelID",
        type: "number",
        title: "Join Channel ID:",
        placeholder: "69"
    }, {
        name: "allowedGroupIDs",
        type: "strings",
        title: "List of group IDs allowed to create a channel:",
        default: [],
        indent: 3
    }, {
        name: "makeBlacklist",
        type: "checkbox",
        title: "Use previous list of allowed groups as blacklist?",
        default: false,
        indent: 3
    }, {
        name: "parentChannelID",
        type: "number",
        title: "Parent Channel ID:",
        placeholder: "69"
    }, {
        name: "channelGroupID",
        type: "number",
        title: "Channel Group ID:",
        placeholder: "69",
        indent: 3
    }, {
        name: "vipParentChannelID",
        type: "number",
        title: "VIP Parent Channel ID:",
        placeholder: "69"
    }, {
        name: "vipGroupID",
        type: "number",
        title: "VIP Group ID:",
        placeholder: "69",
        indent: 3
    }, {
        name: "channelLast",
        type: "checkbox",
        title: "Put channel on the last position instead of on the top?",
        default: false
    }, {
        name: "tempTime",
        type: "number",
        title: "Temporary channel time (max. 31536000, in seconds) (temp. channels will get deleted on server restart) [Default: 0 (permanent)]:",
        placeholder: "0",
        default: 0
    }, {
        name: "adminGroupIDs",
        type: "strings",
        title: "List of admin group IDs allowed to use command(s) [<main_cmd> <task>]:",
        default: []
    }]
}, (_, config, { name, version, author }) => {

    // temporary solution? Different than TS func

    const backend = require("backend");
    const event = require("event");
    const store = require("store");
    const engine = require("engine");

    const { joinChannelID, parentChannelID, allowedGroupIDs, channelGroupID, makeBlacklist, channelLast, vipGroupID, vipParentChannelID, logEnabled } = config;

    let { tempTime } = config;

    const CHANNELNAME = "%nick%'s channel"; // Default: %nick%'s channel
    const MAIN_COMMAND = "!pc";

    const TASK_TEMPUPDATE = "tempupdate";

    const MSG_CANT_CREATE_ALREADYHAS = "You already have a channel!";
    const MSG_CANT_CREATE_NOPERM = "You are not permitted to create a new channel!";
    const MSG_ERROR = "Error ocurred, contact an administrator!";

    if (!isInt(tempTime) || (tempTime !== 0 && !(0 < tempTime && tempTime < 31536000))) {
        tempTime = 0;
        logMsg("Invalid channel temporary time, using permanent.");
    }

    /**
     * EVENTS
     */

    event.on("chat", chat);
    event.on("clientMove", clientMove);
    event.on("serverGroupAdded", sgAdded);
    event.on("serverGroupRemoved", sgRemoved);

    function chat({ text, client }) {
        if (client.isSelf()) return;

        const msg = text.split(" ").filter(i => /\s/.test(i) === false && i.length > 0);
        const command = msg[0];
        const args = msg.slice(1);

        if (command !== MAIN_COMMAND) return;

        const task = args[0];

        switch (task) {
            case TASK_TEMPUPDATE:
                tempUpdate();
                break;
            default:
                return client.chat("Invalid task!");
        }

        // TASKS

        const tempUpdate = () => {
            store.getKeys().forEach(keyName => {
                const channel = backend.getChannelByID(store.get(keyName));

                if (channel) {
                    channelParams = { permanent: (tempTime > 0) ? false : true, deleteDelay: tempTime };
                    channel.update(channelParams)
                }
            });
        };
    }

    function clientMove(params) {
        if (params.client.isSelf()) return;
        if (!params.toChannel) return;

        createChannel(params);

        if (!params.fromChannel && params.toChannel)
            checkVIP(params.client);
    }

    function sgAdded({ client, serverGroup }) {
        if (serverGroup.id() == vipGroupID) checkVIP(client, "has");
    }

    function sgRemoved({ client, serverGroup }) {
        if (serverGroup.id() == vipGroupID) checkVIP(client, "hasnot");
    }

    /**
     * CHANNEL CREATION
     */

    function createChannel({ client, toChannel }) {
        if (toChannel.id() == joinChannelID) {
            try {
                if (hasChannel(client)) return client.moveTo(getChannel(client)); //client.chat(MSG_CANT_CREATE_ALREADYHAS);
                if (!hasPermission(client)) return client.chat(MSG_CANT_CREATE_NOPERM);

                const parentChannel = backend.getChannelByID(parentChannelID);

                if (!parentChannel) throw new Error("Parent channel not found, invalid ID?");

                const newChannelName = CHANNELNAME.replace("%nick%", client.nick()).substring(0, 40);
                if (channelNameExists(newChannelName, parentChannel.id())) return client.chat("Please, change your nickname to create new channel!");

                const newChannelParams = {
                    "name": newChannelName,
                    "parent": parentChannel.id(),
                    "codec": 4, // Opus Voice
                    "codecQuality": 10, // Maximum quality
                    "position": (channelLast) ? null : 0,
                    "permanent": true
                }

                const createdChannel = backend.createChannel(newChannelParams);

                if (!createdChannel) throw new Error("Channel could not be created!");

                if (tempTime > 0) {
                    tempChannelParams = { permanent: false, deleteDelay: tempTime }
                    createdChannel.update(tempChannelParams)
                }

                client.moveTo(createdChannel);

                const channelGroup = backend.getChannelGroupByID(channelGroupID);
                if (!channelGroup) throw new Error("Channel group could not be found!");

                createdChannel.setChannelGroup(client, channelGroup);

                saveChannel(client, createdChannel);

                checkVIP(client);
            } catch (err) {
                client.chat(MSG_ERROR);
                logMsg(`Error: ${err}`);
            }
        }
    }

    /**
     * VIP CHANNEL
     */

    function checkVIP(client, force = null) {
        if (!(vipGroupID && vipParentChannelID)) return logMsg("ERROR: Invalid VIP settings..");

        if (hasChannel(client)) {
            const hasVIP = (force != null) ? ((force === "has") ? true : false) : client.getServerGroups().map(g => g.id()).some(gID => gID == vipGroupID);
            const channel = backend.getChannelByID(store.get(client.uid()));

            if (hasVIP) {
                if (channel.parent().id() != vipParentChannelID) {
                    const vipParentChannel = backend.getChannelByID(vipParentChannelID);

                    if (vipParentChannel)
                        channel.moveTo(vipParentChannelID, (channelLast) ? null : 0);
                    else logMsg("ERROR: No VIP parent channel found!");
                }
            } else {
                if (channel.parent().id() == vipParentChannelID) {
                    const parentChannel = backend.getChannelByID(parentChannelID);

                    if (parentChannel)
                        channel.moveTo(parentChannel, (channelLast) ? null : 0);
                    else logMsg("ERROR: No default parent channel found!");
                }
            }
        }
    }

    /**
     * FUNCTIONS
     */

    function hasPermission(client) {
        const clientGroupsIDs = client.getServerGroups().map(g => g.id());
        return (!makeBlacklist) ? clientGroupsIDs.some(gID => allowedGroupIDs.includes(gID)) : clientGroupsIDs.every(gID => !allowedGroupIDs.includes(gID));
    }

    function saveChannel(client, channel) {
        const uid = client.uid();
        store.set(uid, channel.id());
    }

    function hasChannel(client) {
        const uid = client.uid();
        const channelID = store.get(uid) || 0;
        const channel = backend.getChannelByID(channelID);

        // Remove the channel from the database, if it does not exist (got deleted)
        if (channelID !== 0 && !channel) store.unset(uid);

        return !!channel;
    }

    function getChannel(client) {
        const channelID = store.get(client.uid()) || 0;
        const channel = backend.getChannelByID(channelID);
        if (!channel) throw new Error("Error while getting client's channel!");
        return channel;
    }

    function channelNameExists(channelName, parentID) {
        return backend.getChannels().some(channel => channel.name() === channelName && channel.parent().id() == parentID);
    }

    function isInt(value) {
        return Number.isInteger(+value);
    }

    /**
     * LOG
     */

    function logMsg(msg) {
        return !!logEnabled && engine.log(msg);
    }

    // SCRIPT LOADED SUCCCESFULLY
    engine.log(`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`);
});