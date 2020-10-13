registerPlugin({
    name: "Channel Activity",
    version: "1.0.0",
    description: "Record the activity of clients in a specific channels",
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
        name: "interval",
        type: "number",
        title: "Check interval [Default: 30 (in seconds)]:",
        default: 30,
        placeholder: "30"
    }, {
        name: "channels",
        type: "strings",
        title: "Channel IDs:",
        default: []
    }, {
        name: "adminGroupIDs",
        type: "strings",
        title: "Admin Group IDs of clients, which are able to use admin command(s):",
        default: []
    }, {
        name: "groupIDs",
        type: "strings",
        title: "Group IDs of clients, which's activity will be recorded:",
        default: []
    }, {
        name: "uids",
        type: "strings",
        title: "UIDs of clients, which's activity will be recorded:",
        default: []
    }]
}, (_, config, { name, version, author }) => {

    const engine = require("engine");
    const backend = require("backend");
    const store = require("store");
    const event = require("event");

    /* VARS */

    const { channels, adminGroupIDs, groupIDs, uids, logEnabled } = config;
    let { interval } = config;

    const KEY_NAME = "activity";
    const COMMAND_LIST = "!list";

    /* SIMPLE CHECKS */

    if (!isInt(interval)) {
        interval = 30;
        logMsg("ERROR: Invalid interval, using default (30).");
    }

    if (channels.length > 0 && (groupIDs.length > 0 || uids.length > 0))
        start();
    else return logMsg("ERROR: Script settings are empty, script terminated.");

    /* LISTING ACTIVITY */

    event.on("chat", chatInfo);

    function chatInfo({ client, text, mode }) {
        if (client.isSelf()) return;
        if (mode != 1) return;

        const msg = text.split(" ").filter(i => /\s/.test(i) === false && i.length > 0);
        const command = msg[0].toLowerCase();
        const args = msg.slice(1);

        if (command === COMMAND_LIST.toLowerCase()) {
            if (isAdmin(client)) {
                const timestamp = args[0];
                let list = "[b]Activity:[/b]\n";
                let activity;

                switch (timestamp) {
                    case "week":
                        // list += X
                        activity = getActivity(7);
                        break;
                    case "month":
                        activity = getActivity(30)
                        break;
                    case "all":
                        activity = getActivity(0)
                        break;
                    default: // today only
                        activity = getActivity();
                }

                client.chat(list += activity);
            } else client.chat("No permission!");
        }
    }

    function isAdmin(client) {
        return client.getServerGroups().map(g => g.id()).some(gID => (adminGroupIDs || []).includes(gID))
    }

    function getActivity(days = 1) { // if no activity, check - undefined
        let result = "";

        const today = getToday();
        const startDate = new Date(today);
        const data = getData();

        if (days === 0) days = firstDay(data);

        Array(days).fill("").forEach((_, index) => {
            const todayData = data[startDate.getTime()]

            result += `Date: [b]${startDate}[/b]\n`;

            if (!todayData) result += `[i]No activity today..[/i]`;
            else {
                Object.keys(todayData).forEach(uid => {
                    const nick = getNick(uid);
                    const activity = todayData[uid];

                    result += `Nick: ${nick} Activity: ${activity}`;
                });
            }

            result += "\n";

            startDate.setDate(startDate.getDate() - 1);
        });

        return result;
    }

    function firstDay(data) {
        const msDiff = getToday() - (new Date(parseInt(Object.keys(data).sort((a, b) => a - b)[0])));
        const oneDay = 1000 * 60 * 60 * 24;
        const days = msDiff / oneDay;
        return days + 1; // + 1 including today
    }

    /* NICK SAVING */

    event.on("clientNick", (client, _) => saveNick(client));
    event.on("clientVisible", ({ client }) => saveNick(client));

    function getNick(uid) { return store.get(uid) || "Unknown"; };

    function saveNick(client) {
        if (isInList(client))
            store.set(client.uid(), client.nick())
    };

    /* ACTIVITY STUFF */

    function start() {
        setInterval(() => {
            if (backend.isConnected()) {
                channels.forEach(channelID => {
                    const channel = backend.getChannelByID(channelID);

                    if (channel) {
                        const channelClients = channel.getClients();

                        channelClients.forEach(client => {
                            if (isInList(client))
                                addToData(client, interval);
                        });
                    } else logMsg("ERROR: Channel not found!")
                });
            }
        }, interval * 1000);
    }

    function addToData(client, seconds) {
        const data = getData();
        const today = getToday();
        const todayData = (data[today] || {});
        const uid = client.uid();

        todayData[uid] = (todayData[uid] || 0) + seconds;
        data[today] = todayData;

        saveData(data);
    }

    function getToday() {
        return new Date().setHours(0, 0, 0, 0);
    }

    function getData() {
        return (store.get(KEY_NAME) || {});
    }

    function saveData(data) {
        return store.set(KEY_NAME, data);
    }

    function isInList(client) {
        return client.getServerGroups().map(g => g.id()).some(gID => groupIDs.includes(gID)) ||
            uids.includes(client.uid());
    }

    /* OTHER FUNCTIONS */

    function isInt(value) {
        return Number.isInteger(+value);
    }

    /* LOGGING */

    function logMsg(msg) {
        return !!logEnabled && engine.log(msg);
    }

    // SCRIPT LOADED SUCCCESFULLY
    engine.log(`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`);
});