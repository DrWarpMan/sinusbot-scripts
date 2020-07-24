registerPlugin({
    name: "Online Clients Record",
    version: "1.0.0",
    description: "Show the most online clients record in a channel name!",
    author: "DrWarpMan <drwarpman@gmail.com>",
    backends: ["ts3"],
    engine: ">= 1.0",
    autorun: false,
    enableWeb: false,
    hidden: false,
    requiredModules: [],
    voiceCommands: [],
    vars: [{
        name: "password",
        type: "password",
        title: "Password [Command: \"!ocd <password>\"] (to reset the record):"
    }, {
        name: "channelID",
        type: "number",
        title: "Channel ID (where to show the record):",
        placeholder: "69"
    }, {
        name: "channelName",
        type: "string",
        title: "Channel Name [Placeholder: %record%]:",
        placeholder: "Online Clients Record: %record%",
        default: "Online Clients Record: %record%"
    }, {
        name: "ignoredGroupIDs",
        type: "strings",
        title: "Ignored Group IDs:"
    }, {
        name: "ignoredUIDs",
        type: "strings",
        title: "Ignored UIDs:"
    }]
}, (_, config, { name, version, author }) => {

    const backend = require("backend");
    const engine = require("engine");
    const event = require("event");
    const store = require("store");

    const { password, channelID, channelName, ignoredGroupIDs, ignoredUIDs } = config;

    const RECORD_KEYNAME = "record";
    const RECORD_PLACEHOLDER = "%record%";
    const UPDATE_INTERVAL = 60;
    const COMMAND = "!ocr";

    event.on("chat", ({ client, text, mode }) => {
        if (mode != 1) return; // if not private chat
        if (client.isSelf()) return; // ignore bot /self/ messages
        if (!password) return; // if password is not defined

        if (text === `${COMMAND} ${password}`) {
            resetRecord();
            client.chat("Online Clients Record successfully reset!");
        }
    });

    event.on("clientMove", checkRecord);

    setInterval(updateChannel, UPDATE_INTERVAL * 1000);

    function updateChannel() {
        const channel = backend.getChannelByID(channelID);

        if (channel && channelName)
            channel.setName(channelName.replace(RECORD_PLACEHOLDER, getRecord()));
    }

    function checkRecord() {
        const online = backend.getClients().filter(client => !isIgnored(client)).length;
        let record = getRecord();

        record = (record > online) ? record : online;

        setRecord(record);
    }

    function setRecord(record) {
        store.setInstance(RECORD_KEYNAME, record);
    }

    function getRecord() {
        return store.getInstance(RECORD_KEYNAME) || 0;
    }

    function resetRecord() {
        store.getKeysInstance().forEach(keyName => store.unsetInstance(keyName));
    }

    /**
     * If client is in one of the configured ignored group IDs or UIDs
     *
     * @param   {Client}  client  
     *
     * @return  {boolean}
     */
    function isIgnored(client) {
        return ((ignoredUIDs || []).includes(client.uid())) || (client.getServerGroups().map(g => g.id()).some(gID => (ignoredGroupIDs || []).includes(gID)));
    }

    // SCRIPT LOADED SUCCCESFULLY
    engine.log(`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`);
});