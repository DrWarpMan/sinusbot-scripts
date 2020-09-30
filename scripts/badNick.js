registerPlugin({
    name: "Bad Nick",
    version: "1.0.0",
    description: "Kick clients, that use not allowed nicknames!",
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
        name: "kickMessage",
        type: "string",
        title: "Kick Message [80 chars.]:",
        placeholder: "Please, change your nickname!",
        default: ""
    }, {
        name: "regexRules",
        type: "multiline",
        title: "Regex rules:",
        default: ""
    }, {
        name: "delay",
        type: "number",
        title: "Delay in seconds:",
        default: 0
    }]
}, (_, config, { name, version, author }) => {

    const engine = require("engine");
    const event = require("event");
    const backend = require("backend");

    const { kickMessage, delay, logEnabled } = config;
    let { regexRules } = config;

    if (kickMessage.length > 80) logMsg("WARN: Kick message too long!");

    console.log(regexRules);

    regexRules = (regexRules || "").split("\n");

    regexRules = regexRules.map(rule => {
        const capture = rule.match(/^[ ]{0,}\/(.{1,})\/([gmixXsuUAJ]{0,10})[ ]{0,}$/i); // Part of Multivitamin's regex code

        try {
            if (!capture) {
                logMsg(`WARN: Incorrect regexp (${rule}), trying to use it anyway..`);
                return new RegExp(rule, "i");
            } else {
                return new RegExp(capture[1], capture[2]);
            }
        } catch (err) {
            logMsg(`ERROR: Invalid regex rule (${rule}), ignoring..`);
            return false;
        }
    });

    regexRules = regexRules.filter(rule => rule);

    if (regexRules.length <= 0) return logMsg("ERROR: No configuration!");

    logMsg(`Rules list: ${regexRules.join(", ")}`);

    event.on("clientNick", checkNick);
    event.on("clientVisible", ({ client }) => { if (isConnected) checkNick(client); });
    if (backend.isConnected()) checkAll();

    function checkNick(client) {
        const nick = client.nick();

        regexRules.forEach(rule => {
            const match = nick.match(rule);
            if (match === null) return;
            else {
                setTimeout(() => {
                    client.kick(kickMessage.substring(0, 80));
                }, parseInt(delay) * 1000);
            }
        });
    }

    function checkAll() {
        return backend.getClients().forEach(client => checkNick(client));
    }

    /* CONNECTED CHECK */

    let isConnected = false;

    function checkConnection() {
        setTimeout(() => {
            if (backend.isConnected())
                isConnected = true;
        }, 10 * 1000);
    }

    event.on("connect", connected);
    event.on("disconnect", disconnected);

    function connected() {
        checkConnection();
        checkAll();
    }

    function disconnected() { isConnected = false }

    if (!isConnected) checkConnection();

    /* LOG MSG */

    function logMsg(msg) {
        return !!logEnabled && engine.log(msg);
    }

    // SCRIPT LOADED SUCCCESFULLY
    engine.log(`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`);
});