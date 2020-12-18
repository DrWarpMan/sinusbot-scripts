registerPlugin({
    name: "Nick Database",
    version: "1.0.0",
    description: "Script that will save nicknames for each client, to load them later whilst client's are offline!",
    author: "DrWarpMan <drwarpman@gmail.com>",
    backends: ["ts3"],
    engine: ">= 1.0",
    autorun: true,
    enableWeb: false,
    hidden: false,
    requiredModules: [],
    voiceCommands: [],
    vars: [{
        name: "logEnabled",
        type: "checkbox",
        title: "Check to enable detailed logs",
        default: false
    }]
}, (_, config, { name, version, author }) => {

    const engine = require("engine");
    const store = require("store");
    const event = require("event");

    const { logEnabled } = config;

    event.on("clientNick", (client, _) => saveNick(client));
    event.on("clientVisible", ({ client }) => saveNick(client));

    function getNick(uid) { return store.get(uid) || false };

    function saveNick(client) {
        return store.set(client.uid(), client.nick());
    };

    module.exports = {
        getNick
    };

    function logMsg(msg) {
        return !!logEnabled && engine.log(msg);
    }

    // SCRIPT LOADED SUCCCESFULLY
    engine.log(`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`);
});