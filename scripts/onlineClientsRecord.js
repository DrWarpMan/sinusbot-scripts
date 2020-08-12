registerPlugin({
    name: "Online Clients Record",
    version: "2.0.1",
    description: "Show the most online clients record in a channel name and population statistics in a channel description!",
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
        name: "password",
        type: "password",
        title: "Password [Command: \"!ocr <password> <task>\"] (possible tasks are: reset_global, reset_daily, reset_today, reset_visits, reset_all):",
        default: ""
    }, {
        name: "channels",
        type: "array",
        title: "Channels:",
        vars: [{
            name: "id",
            type: "number",
            title: "Channel ID (where to show the record):",
            placeholder: "69"
        }, {
            name: "name",
            type: "string",
            title: "Channel Name [Placeholder: %g_record%, %y%, %m%, %d%, %h%, %m%, %t_record%]:",
            placeholder: "Online Clients Record: %g_record%",
            default: "Online Clients Record: %g_record%"
        }, {
            name: "topic",
            type: "string",
            title: "Channel Topic [Placeholder: %g_record%, %y%, %m%, %d%, %h%, %m%, %t_record%]:",
            placeholder: "Record: %g_record% Date: %d%.%m%.%y% %h%:%m%",
            default: "Record: %g_record% Date: %d%.%m%.%y% %h%:%m%"
        }, {
            name: "description",
            type: "multiline",
            title: "Channel Description [Placeholder: %stats%, %days%]:",
            placeholder: "%stats%",
            default: "%stats%"
        }, {
            name: "descriptionDays",
            type: "number",
            title: "How many days back, should be shown in the channel description? [EXCLUDING TODAY] (Max. 59, Min. 0):",
        }, {
            name: "descriptionDate",
            type: "string",
            title: "Date format in channel description [Placeholder: %y%, %m%, %d%]:"
        }, {
            name: "headerDate",
            type: "string",
            title: "HEADER [Date]:",
            placeholder: "Date"
        }, {
            name: "headerUniqueVisits",
            type: "string",
            title: "HEADER [Unique Visits]:",
            placeholder: "Unique Visits"
        }, {
            name: "headerRecordOnline",
            type: "string",
            title: "HEADER [Record Online]:",
            placeholder: "Record"
        }]
    }, {
        name: "ignoredGroupIDs",
        type: "strings",
        title: "Ignored Group IDs:",
        default: []
    }, {
        name: "ignoredUIDs",
        type: "strings",
        title: "Ignored UIDs:",
        default: []
    }, {
        name: "dateZeros",
        type: "checkbox",
        title: "Add zeros to day & month?",
        default: false
    }]
}, (_, config, { name, version, author }) => {

    const backend = require("backend");
    const engine = require("engine");
    const event = require("event");
    const store = require("store");

    const { logEnabled, password, channels, ignoredGroupIDs, ignoredUIDs, dateZeros } = config;

    const GLOBAL_RECORD_KEYNAME = "record";
    const UNIQUE_VISITS_KEYNAME = "visits";
    const DAILY_RECORDS_KEYNAME = "daily";
    const IP_SAVE_KEYNAME = "ip";
    const GLOBAL_RECORD_PHOLDER = "%g_record%";
    const TODAY_RECORD_PHOLDER = "%t_record%";
    const UPDATE_INTERVAL = 60;
    const COMMAND = "!ocr";

    setInterval(updateChannels, UPDATE_INTERVAL * 1000);

    event.on("clientMove", checkClient);
    event.on("clientIPAddress", checkVisits);
    event.on("chat", chatCommands);

    function chatCommands({ client, text, mode }) {
        if (client.isSelf()) return;
        if (mode != 1) return; // if not private chat
        if (!password || password.length < 1) return; // if password is not defined, disable command usage

        const msg = text.split(" ").filter(i => /\s/.test(i) === false && i.length > 0);
        const command = msg[0].toLowerCase();
        const args = msg.slice(1);
        const inputPassword = args[0];
        const task = args[1];

        if (command === COMMAND) {
            if (inputPassword === password) {
                switch (task) {
                    case "reset_all":
                        resetAll();
                        logMsg(`Client "${client.nick()}" reset whole database! (${client.uid()})`);
                        client.chat("Everything was reset!");
                        break;
                    case "reset_global":
                        resetRecordGlobal();
                        logMsg(`Client "${client.nick()}" reset the global record! (${client.uid()})`);
                        client.chat("Global record was reset!");
                        break;
                    case "reset_daily":
                        resetDailyRecords();
                        logMsg(`Client "${client.nick()}" reset daily records! (${client.uid()})`);
                        client.chat("Daily records was reset!");
                        break;
                    case "reset_visits":
                        resetUniqueVisits();
                        logMsg(`Client "${client.nick()}" reset unique visits! (${client.uid()})`);
                        client.chat("Unique visits were reset!");
                        break;
                    case "reset_today":
                        resetTodaysRecord();
                        logMsg(`Client "${client.nick()}" reset today's record! (${client.uid()})`);
                        client.chat("Today's record was reset!");
                        break;
                    default:
                        client.chat("Invalid task!");
                        break;
                }
            } else {
                logMsg(`Client "${client.nick()}" used invalid password! (${client.uid()})`);
                client.chat("Invalid password!");
            }
        }
    }

    function updateChannels() {
        if (!backend.isConnected()) return;

        channels.forEach(({ id, name, topic, description, descriptionDays: days, descriptionDate: dateFormat, headerUniqueVisits: headerUV, headerDate: headerD, headerRecordOnline: headerRO }) => {
            const channel = backend.getChannelByID(id);

            if (channel) {
                logMsg(`Updating channel with ID: ${id}`);

                /*
                    NAME, TOPIC
                */

                const { record: recordGlobal, date: dateGlobal } = getRecordGlobal();

                const getChannelName = (name, record, date) => {
                    name = name
                        .replace(GLOBAL_RECORD_PHOLDER, record)
                        .replace(TODAY_RECORD_PHOLDER, getRecordToday());
                    name = replaceDate(name, date);
                    return name;
                };

                const getChannelTopic = (topic, record, date) => {
                    topic = topic
                        .replace(GLOBAL_RECORD_PHOLDER, record)
                        .replace(TODAY_RECORD_PHOLDER, getRecordToday());
                    topic = replaceDate(topic, date);
                    return topic;
                };

                /*
                    DESCCRIPTION
                */

                const getChannelDescription = (description, days, visits, dailyRecords) => {
                    if (!dateFormat) dateFormat = "%d%.%m%.%y%";

                    let stats = "[table]";

                    stats += `\n[tr]` + `[th]${headerD || "Date"}[/th]` + `[th]         ${headerUV || "Unique Visits"}         [/th]` + `[th]${headerRO || "Record"}[/th]` + `\n[/tr]`;

                    days = parseInt(days);
                    if (!days || days < 0 || days > 59) days = 0;

                    const currentDay = new Date(parseInt(getToday()));

                    Array(days + 1).fill("").forEach(() => {
                        const thisDayVisits = (visits[currentDay.getTime()] || []).length;
                        const thisDayRecord = dailyRecords[currentDay.getTime()] || 0;

                        stats += `\n[tr][td][center]${replaceDate(dateFormat, currentDay)}[/center][/td]`;
                        stats += `\n[td][center]${thisDayVisits}[/center][/td]`;
                        stats += `\n[td][center]${thisDayRecord}[/center][/td][/tr]`;

                        currentDay.setDate(currentDay.getDate() - 1);
                    });

                    stats += "\n[/table]";

                    return description.replace("%stats%", stats).replace("%days%", days + 1);
                }

                name = (name) ? getChannelName(name, recordGlobal, dateGlobal) : channel.name();
                topic = (topic) ? getChannelTopic(topic, recordGlobal, dateGlobal) : channel.topic();
                description = (description) ? getChannelDescription(description, days, getUniqueVisits(), getDailyRecords()) : channel.description();

                channel.update({
                    name,
                    topic,
                    description
                });
            } else logMsg(`Channel invalid! (ID: ${id})`);
        });
    }

    function checkClient() {
        checkGlobalRecord();
        checkDailyRecords();
    }

    /**
     * UNIQUE VISITS
     */
    function checkVisits(client) {
        if (isIgnored(client)) return;

        const uid = client.uid();
        const ip = client.getIPAddress();

        if (!ip) return logMsg(`[VISITS] Couldn't get IP address from client with UID: ${uid} - ignoring..`);

        saveIP(client, ip);

        const visits = getUniqueVisits();

        const today = getToday();
        const visitsToday = visits[today] || [];


        logMsg(`[VISITS] Checking visit for client with UID: ${uid}`)
        if (!visited(visitsToday, uid, ip)) {
            logMsg(`[VISITS] Client did not visit today!`);
            visitsToday.push({ uid: ip });
            visits[today] = visitsToday;
            const saveVisits = setUniqueVisits(visits);
            logMsg(`[VISITS] Visits ${(saveVisits) ? "UPDATED": "NOT UPDATED"}!`)
        } else logMsg(`[VISITS] Client already visited today..`);

    }

    function getUniqueVisits() {
        return store.getInstance(UNIQUE_VISITS_KEYNAME) || {};
    }

    function setUniqueVisits(visits) {
        return store.setInstance(UNIQUE_VISITS_KEYNAME, visits);
    }

    function resetUniqueVisits() {
        store.unsetInstance(UNIQUE_VISITS_KEYNAME);
    }

    function visited(visitsToday, uid, ip) {
        return visitsToday.some(clientData => Object.keys(clientData).includes(uid) || Object.values(clientData).includes(ip));
    }

    /**
     * GLOBAL RECORD
     */

    function checkGlobalRecord() {
        const online = getOnline();

        let { record } = getRecordGlobal();

        if (record >= online)
            logMsg(`[GLOBAL RECORD] Checking - (OLD RECORD) ${record} > ${online} (ONLINE), record not beaten.. continuing!`)
        else {
            logMsg(`[GLOBAL RECORD] Checking - (OLD RECORD) ${record} < ${online} (ONLINE), record beaten.. saving!`);
            record = online;
            const save = setRecordGlobal(record);
            logMsg((save) ? "Record saved!" : "Record could not be saved!");
        }
    }

    function setRecordGlobal(record, date = new Date()) {
        return store.setInstance(GLOBAL_RECORD_KEYNAME, { record, date });
    }

    function getRecordGlobal() {
        return store.getInstance(GLOBAL_RECORD_KEYNAME) || { "record": 0, "date": 0 };
    }

    function resetRecordGlobal() {
        store.unsetInstance(GLOBAL_RECORD_KEYNAME);
    }

    /**
     * DAILY RECORDS
     */

    function checkDailyRecords() {
        const online = getOnline();

        const dailyRecords = getDailyRecords();
        const today = getToday();
        let todaysRecord = dailyRecords[today] || 0;

        if (todaysRecord >= online)
            logMsg(`[DAILY RECORDS] Checking - (OLD RECORD) ${todaysRecord} > ${online} (ONLINE), record not beaten.. continuing!`)
        else {
            logMsg(`[DAILY RECORDS] Checking - (OLD RECORD) ${todaysRecord} < ${online} (ONLINE), record beaten.. saving!`);
            todaysRecord = online;
            dailyRecords[today] = todaysRecord;
            const save = setDailyRecords(dailyRecords);
            logMsg((save) ? "Record saved!" : "Record could not be saved!");
        }
    }

    function getDailyRecords() {
        return store.getInstance(DAILY_RECORDS_KEYNAME) || {};
    }

    function setDailyRecords(dailyRecords) {
        return store.setInstance(DAILY_RECORDS_KEYNAME, dailyRecords);
    }

    function resetDailyRecords() {
        store.unsetInstance(DAILY_RECORDS_KEYNAME);
    }

    function resetTodaysRecord() {
        const dailyRecords = getDailyRecords();
        const today = getToday();

        delete dailyRecords[today];

        setDailyRecords(dailyRecords);
    }

    /**
     * OTHER
     */

    function getOnline() {
        const clients = removeDuplicits(backend.getClients().filter(client => !isIgnored(client)));
        return clients.length;
    }

    function removeDuplicits(clients) {
        const uniqueClients = [];

        clients.forEach(client => {
            const cUid = client.uid();
            const cIp = loadIP(client);

            if (cIp) {
                if (!uniqueClients.some(uniqueClient => {
                        const ucUid = uniqueClient.uid();
                        const ucIp = loadIP(uniqueClient);

                        if (!ucIp) return false;

                        return (ucUid === cUid || ucIp === cIp);
                    })) uniqueClients.push(client);
            } else uniqueClients.push(client);
        });

        return uniqueClients;
    }

    function resetAll() {
        store.getKeysInstance().forEach(keyName => store.unsetInstance(keyName));
    }

    function getToday() {
        const d = new Date();

        d.setHours(0);
        d.setMinutes(0);
        d.setSeconds(0);
        d.setMilliseconds(0);

        return `${d.getTime()}`;
    }

    function getRecordToday() {
        const dailyRecords = getDailyRecords();
        const currentDay = new Date(parseInt(getToday()));
        const recordToday = dailyRecords[currentDay.getTime()] || 0;

        return recordToday;
    }

    function replaceDate(str, date) {
        if (!date) return str;
        try {
            date = new Date(date);

            const year = date.getFullYear();
            const month = (dateZeros) ? (((date.getMonth() + 1) < 10) ? "0" : "") + (date.getMonth() + 1) : date.getMonth() + 1;
            const day = (dateZeros) ? ((date.getDate() < 10) ? "0" : "") + date.getDate() : date.getDate();
            const hours = ((date.getHours() < 10) ? "0" : "") + date.getHours();
            const minutes = ((date.getMinutes() < 10) ? "0" : "") + date.getMinutes();

            return str
                .replace("%y%", year)
                .replace("%m%", month)
                .replace("%d%", day)
                .replace("%h%", hours)
                .replace("%m%", minutes);
        } catch (err) { return str };
    };

    function saveIP(client, ip) {
        store.setInstance(`${IP_SAVE_KEYNAME} ${client.uid()}`, ip);
    }

    function loadIP(client) {
        return store.getInstance(`${IP_SAVE_KEYNAME} ${client.uid()}`);
    }

    function isIgnored(client) {
        return ((ignoredUIDs || []).includes(client.uid())) || (client.getServerGroups().map(g => g.id()).some(gID => (ignoredGroupIDs || []).includes(gID)));
    }

    function logMsg(msg) {
        return !!logEnabled && engine.log(msg);
    }

    // SCRIPT LOADED SUCCCESFULLY
    logMsg(`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`);
});