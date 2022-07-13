registerPlugin({
    name: "OS Groups",
    version: "1.0.2",
    description: "Assign groups based on their OS (operating system) - Windows, Linux, Mac",
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
        name: "groupW",
        type: "number",
        title: "Group ID [Windows]:",
        placeholder: "69"
    }, {
        name: "groupL",
        type: "number",
        title: "Group ID [Linux]:",
        placeholder: "69"
    }, {
        name: "groupM",
        type: "number",
        title: "Group ID [Mac]:",
        placeholder: "69"
    }, {
        name: "groupA",
        type: "number",
        title: "Group ID [Android]:",
        placeholder: "69"
    }, {
        name: "groupI",
        type: "number",
        title: "Group ID [iOS]:",
        placeholder: "69"
    }, {
        name: "ignoredGroupIDs",
        type: "strings",
        title: "Ignored Group IDs:"
    }]
}, (_, config, { name, version, author }) => {

    const backend = require("backend");
    const engine = require("engine");
    const event = require("event");

    const { logEnabled, groupW, groupL, groupM, groupA, groupI, ignoredGroupIDs } = config;

    event.on("clientMove", clientMove);

    function clientMove({ client, fromChannel, toChannel }) {
        if (!isConnected) return logMsg("Waiting for backend.. if this message persists, there is a bug.");
        if (client.isSelf()) return;

        const justConnected = (!fromChannel && toChannel) ? true : false;

        if (justConnected)
            setTimeout(() => checkOS(client), 1 * 1000);
    }

    function checkOS(client) {
        if (ignored(client)) return logMsg(`${client.nick()} is ignored, skipping..`);

        logMsg(`${client.nick()} just connected, checking OS..`);

        const os = client.getPlatform();

        switch (os) {
            case "Windows":
                logMsg(`Recognized OS: "${os}" (UID: ${client.uid()})`);
                addGroup(client, groupW);
                break;
            case "Linux":
                logMsg(`Recognized OS: "${os}" (UID: ${client.uid()})`);
                addGroup(client, groupL);
                break;
            case "OS X":
                logMsg(`Recognized OS: "${os}" (UID: ${client.uid()})`);
                addGroup(client, groupM);
                break;
            case "Android":
                logMsg(`Recognized OS: "${os}" (UID: ${client.uid()})`);
                addGroup(client, groupA);
                break;
            case "iOS":
                logMsg(`Recognized OS: "${os}" (UID: ${client.uid()})`);
                addGroup(client, groupI);
                break;
            default:
                logMsg(`Unrecognized OS: "${os}" (UID: ${client.uid()})`);
        }
    }

    function ignored(client) {
        return client.getServerGroups().map(g => g.id()).some(gID => (ignoredGroupIDs || []).includes(gID));
    }

    function addGroup(client, groupID) {
        const groupToAdd = backend.getServerGroupByID(groupID);

        if (!groupToAdd) return logMsg(`FATAL: Group with ID: ${groupID} NOT found!`);

        if (!isInGroup(client, groupID))
            client.addToServerGroup(groupToAdd);

        removeOtherGroups(client, groupID);
    }

    function removeOtherGroups(client, groupID) {
        const osGroups = [groupW, groupL, groupM, groupA, groupI].filter(gID => gID != groupID);

        osGroups.forEach(gID => {
            const groupToRemove = backend.getServerGroupByID(gID);
            if (!groupToRemove) logMsg(`WARNING: Group with ID: ${gID} NOT found!`);
            else if (isInGroup(client, gID)) client.removeFromServerGroup(groupToRemove);
        });
    }

    function isInGroup(client, groupID) {
        return client.getServerGroups().map(g => g.id()).some(gID => gID == groupID);
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

    /* Logging */

    function logMsg(msg) {
        return !!logEnabled && engine.log(msg);
    }

    // SCRIPT LOADED SUCCCESFULLY
    engine.log(`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`);
});