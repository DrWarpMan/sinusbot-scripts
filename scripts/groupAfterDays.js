registerPlugin({
    name: "Group After Days",
    version: "1.0.0",
    description: "Assign group to a client after X days from first connection",
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
        title: "Ignored Group IDs:"
    }, {
        name: "groups",
        type: "array",
        title: "List of group IDs and needed days:",
        vars: [{
                name: "groupID",
                type: "number",
                title: "Group ID:",
            },
            {
                name: "neededDays",
                type: "number",
                title: "Needed days:",
            },
            {
                name: "neededConnections",
                type: "number",
                title: "Needed connections:",
            }
        ]
    }]
}, (_, config, { name, version, author }) => {

    const engine = require("engine");
    const event = require("event");
    const backend = require("backend");

    const { ignoredGroupIDs, logEnabled } = config;
    let { groups } = config;

    if (groups.length <= 0) return logMsg("Empty group data.");

    logMsg("Filtering invalid data..");
    groups = groups.filter(({ groupID, neededDays, neededConnections }) => {
        return [groupID, neededDays, neededConnections].every(val => isInt(val) >= 0);
    });

    event.on("clientMove", clientMove);

    function clientMove({ client, toChannel, fromChannel }) {
        if (!isConnected) return;
        if (client.isSelf()) return;
        if (isIgnored(client)) return;
        if ((toChannel && fromChannel) || !toChannel) return; // only on connection

        setTimeout(() => check(client), 1 * 1000);

        const check = client => {
            const firstConnection = client.getCreationTime();
            const connections = client.getTotalConnections();

            if (firstConnection && connections) {
                logMsg(`Checking client: ${client.nick()}`);

                const dateNow = new Date();
                const dateConnected = new Date(firstConnection);
                const dateDiff = dateNow - dateConnected;

                const oneDay = 24 * 60 * 60 * 1000;
                const days = Math.floor(dateDiff / oneDay);

                logMsg(`Days from first connection: ${days}`)
                logMsg(`Connections: ${connections}`)

                const addGroupID = findGroupID(days, connections);

                if (!addGroupID) return logMsg(`No group yet! :)`);

                const group = backend.getServerGroupByID(addGroupID);

                if (!group) return logMsg(`ERROR: Group with ID ${addGroupID} does not exist!`);

                logMsg(`Trying to add group with ID: ${addGroupID}`);
                if (!hasSGWithID(client, addGroupID)) {
                    client.addToServerGroup(group);
                    logMsg(`Group added.`);
                } else logMsg(`Group already added!`);

                const otherGroupIDs = groups.map(({ groupID }) => groupID).filter(groupID => groupID != addGroupID);

                logMsg(`Try to remove other groups if have any..`);
                removeGroups(client, otherGroupIDs);
                logMsg(`Done.`);
            } else logMsg(`Couldn't get data from: ${client.nick()}`);
        }
    }

    function removeGroups(client, groups) {
        const clientGroups = client.getServerGroups().map(g => g.id());
        const sameGroups = clientGroups.filter(cGroupID => groups.some(groupID => groupID == cGroupID));
        sameGroups.forEach(groupID => {
            const group = backend.getServerGroupByID(groupID);
            if (hasSGWithID(client, groupID)) client.removeFromServerGroup(group);
        });
    }

    function hasSGWithID(client, groupID) {
        return client.getServerGroups().map(g => g.id()).includes(`${groupID}`);
    }

    function findGroupID(days = 0, connections = 0) {
        // OLD CODE, IGNORE
        //const matches = (groups || []).filter(({ neededDays }) => neededDays <= days);
        //return (matches.length <= 0) ? false : matches[matches.length - 1].groupID;

        let match = 0;

        (groups || []).forEach(groupData => {
            if (days >= groupData.days && connections >= groupData.connections)
                match = groupData;
        });

        return match;
    }

    function isIgnored(client) {
        return client.getServerGroups().map(g => g.id()).some(gID => ignoredGroupIDs.includes(gID));
    }

    function isInt(value) {
        return Number.isInteger(+value);
    }

    /**
     * CONNECTED CHECK
     * - To avoid Sinusbot from spam, when Sinusbot joins the server,
     * - every client on the server will fire the "clientMove" event.
     * - This function should eliminate this problem.
     */

    let isConnected = false;

    event.on("connect", checkConnection);

    event.on("disconnect", disconnected);

    function disconnected() { isConnected = false }

    function checkConnection() {
        setTimeout(() => {
            if (backend.isConnected())
                isConnected = true;
        }, 10 * 1000);
    }

    if (!isConnected) checkConnection();

    /* Logging */

    function logMsg(msg) {
        return !!logEnabled && engine.log(msg);
    }

    // SCRIPT LOADED SUCCCESFULLY
    engine.log(`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`);
});