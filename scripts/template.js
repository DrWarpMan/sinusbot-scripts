registerPlugin({
    name: "Template",
    version: "0.1.0",
    description: "Template description",
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
    }]
}, (_, config, { name, version, author }) => {

    const engine = require("engine");

    engine.log(`\n[LOADING] Script: "${name}" Version: "${version}" Author: "${author}"`);

    const log = msg => !!config.logEnabled && engine.log(msg);

    engine.log(`\n[SUCCESS] Script: "${name}" Version: "${version}" Author: "${author}"`);
});