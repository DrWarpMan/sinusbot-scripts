registerPlugin({
    name: "Online Clients Record",
    version: "0.0.1",
    description: "Online Clients Record",
    author: "DrWarpMan <drwarpman@gmail.com>",
    backends: ["ts3"],
    engine: ">= 1.0",
    autorun: false,
    enableWeb: false,
    hidden: false,
    requiredModules: [],
    voiceCommands: [],
    vars: []
}, (_, config, { name, version, author }) => {

    const backend = require("backend");
    const engine = require("engine");
    const event = require("event");
    const store = require("store");


    // SCRIPT LOADED SUCCCESFULLY
    engine.log(`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`);
});