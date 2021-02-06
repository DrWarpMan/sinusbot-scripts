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
        name: "extraVipParentChannelID",
        type: "number",
        title: "Extra-VIP Parent Channel ID:",
        placeholder: "69"
    }, {
        name: "extraVipGroupID",
        type: "number",
        title: "Extra-VIP Group ID:",
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
        title: "Temporary channel time (max. 31536000, in seconds) [Default: 0 (permanent)]:",
        placeholder: "0",
        default: 0
    }]
}, (_, config, { name, version, author }) => {

    const backend = require("backend");
    const event = require("event");
    const store = require("store");
    const engine = require("engine");

    engine.log(`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`);

    const { joinChannelID, parentChannelID, allowedGroupIDs, channelGroupID, makeBlacklist, channelLast, vipGroupID, vipParentChannelID, extraVipGroupID, extraVipParentChannelID, logEnabled } = config;

    let { tempTime } = config;

    if (!isInt(tempTime) || (tempTime !== 0 && !(0 < tempTime && tempTime <= 31536000))) {
        tempTime = 0;
        logMsg("Invalid channel temporary time, using permanent.");
    }

    const COMMAND_UPGRADE = "!upgrade";

    const CHANNELNAME = "%nick%'s channel"; // Default: %nick%'s channel

    //const MSG_CANT_CREATE_ALREADYHAS = "You already have a channel!";
    const MSG_CANT_CREATE_NOPERM = "You are not permitted to create a new channel!";
    const MSG_ERROR = "Error ocurred, contact an administrator!";

    /**
     * TEMPORARY CHECK
     */

    if (tempTime !== 0) temporaryCheck();
    else logMsg("Temporary cleaner disabled!");

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function temporaryCheck() {
        const checkDate = new Date();
        checkDate.setHours(24, 0, 0, 0); // every midnight
        const msUntilThen = checkDate.getTime() - Date.now();
        setTimeout(temporaryCleaner, msUntilThen);
        logMsg(`Temporary cleaning scheduled at ${checkDate}`);
    }

    async function temporaryCleaner() {
        if (backend.isConnected()) {
            logMsg(`Temporary cleaning started!`);
            let removedCount = 0;

            for (const uid of store.getKeys()) {
                const channelID = store.get(uid);
                const channel = backend.getChannelByID(channelID);

                logMsg(`Temp-checking channel -> ${channelID} (${uid})`);

                if (channel) {
                    if (channel.getClientCount() <= 0) {
                        channel.update({ permanent: false, deleteDelay: tempTime });

                        await sleep(500); // a little break

                        if (backend.getChannelByID(channelID)) {
                            channel.update({ permanent: true });
                            logMsg(`--- Channel persisting!`);
                        } else {
                            removedCount++;
                            logMsg(`--- Channel removed!`);
                        }
                    } else logMsg(`--- Channel not empty, ignoring!`);
                } else {
                    store.unset(uid);
                    logMsg(`--- Found deleted channel, removing from DB | ${channelID} ${uid}`);
                }
            }
            logMsg(`Temporary cleaning finished, removed ${removedCount} channels!`);
        } else logMsg(`Backend not connected, scheduling again..`);

        temporaryCheck();
    }

    /**
     * EVENTS
     */

    event.on("chat", chat);
    event.on("clientMove", clientMove);

    function chat({ text, client }) {
        if (client.isSelf()) return;

        const msg = text.split(" ").filter(i => /\s/.test(i) === false && i.length > 0);
        const command = msg[0].toLowerCase();
        //const args = msg.slice(1);

        if (command === COMMAND_UPGRADE)
            checkVIP(client);
    }

    function clientMove(params) {
        if (params.client.isSelf()) return;
        if (!params.toChannel) return;
        createChannel(params);
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

                client.moveTo(createdChannel);

                const channelGroup = backend.getChannelGroupByID(channelGroupID);
                if (!channelGroup) throw new Error("Channel group could not be found!");

                createdChannel.setChannelGroup(client, channelGroup);

                saveChannel(client, createdChannel);
            } catch (err) {
                client.chat(MSG_ERROR);
                logMsg(`Error: ${err}`);
            }
        }
    }

    /**
     * VIP CHANNEL
     */

    function checkVIP(client) {
        if (hasChannel(client)) {
            const clientGroups = client.getServerGroups().map(g => g.id());
            const vipType = (clientGroups.some(gID => gID == (extraVipGroupID || 0))) ? "extra" : ((clientGroups.some(gID => gID == (vipGroupID || 0))) ? "vip" : "none");
            const channel = backend.getChannelByID(store.get(client.uid()));
            const parentID = channel.parent().id();

            switch (vipType) {
                case "extra":
                    if (parentID != extraVipParentChannelID) {
                        const extraVipParentChannel = backend.getChannelByID(extraVipParentChannelID);

                        if (extraVipParentChannel) {
                            channel.moveTo(extraVipParentChannelID, (channelLast) ? null : 0);
                            client.chat("Channel upgraded!");
                        } else logMsg("ERROR: No Extra-VIP parent channel found!");
                    } else client.chat("Already at the maximum upgrade level!");
                    break;
                case "vip":
                    if (parentID != vipParentChannelID) {
                        const vipParentChannel = backend.getChannelByID(vipParentChannelID);

                        if (vipParentChannel) {
                            channel.moveTo(vipParentChannelID, (channelLast) ? null : 0);
                            client.chat("Channel upgraded!");
                        } else logMsg("ERROR: No VIP parent channel found!");
                    } else client.chat("Already at the maximum upgrade level!");
                    break;
                default:
                    if (parentID != parentChannelID) {
                        const parentChannel = backend.getChannelByID(parentChannelID);
                        if (parentChannel) {
                            channel.moveTo(parentChannelID, (channelLast) ? null : 0);
                            client.chat("Channel upgraded!");
                        } else logMsg("ERROR: No default parent channel found!");
                    } else client.chat("Already at the maximum upgrade level!");
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
});