registerPlugin({
    name: "You are mine!",
    version: "1.0.0",
    description: "Bot rental system",
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
    const event = require("event");
    const store = require("store");
    const backend = require("backend");
    const media = require("media");

    /***************************
    /     CONFIGURATION        /
    ***************************/

    const RENT_TIME = 5 * 60 * 1000; // in minutes
    const RENT_COOLDOWN = 1 * 60 * 1000; // in minutes
    const RENT_DEFAULT_CHANNEL = "15"; // ID
    const RADIOS = {
        "chill": "https://listen.reyfm.de/chillout_128kbps.mp3"
    }

    /***************************
    /     INIT                 /
    ***************************/

    engine.log(`*** LOADING *** Script: "${name}" Version: "${version}" Author: "${author}"`);

    const log = msg => !!config.logEnabled && engine.log(msg);

    const KEY_RENT = "rentalbot";
    const KEY_COOLDOWN = "rentalcooldown";
    const RENT_CHECK_INTERVAL = 60 * 1000;

    let BOT_UID = "";

    setInterval(rentRefreshBot, RENT_CHECK_INTERVAL);

    /***************************
    /     EVENTS               /
    ***************************/

    event.on("connect", () => BOT_UID = backend.getBotClient().uid());

    event.on("chat", ({ client, mode, text }) => {
        if (client.isSelf() || // Ignore self
            mode !== 1) // Watch only private chat
            return;

        const msg = text.split(" ").filter(i => /\s/.test(i) === false && i.length > 0);
        const command = msg[0];
        const args = msg.slice(1);

        switch (command) {
            case "rent":
                log(client.nick() + ` is trying to rent a bot!`);
                rentMake(client);
                break;
            case "playlist":
                const playlistID = args[0] || false;
                choosePlaylist(client, playlistID);
                break;
            case "radio":
                const radioName = args[0] || false;
                chooseRadio(client, radioName);
                break;
            case "othercmd3":
                break;
            default:
                return; // no valid command
        }
    });

    event.on("clientMove", ({ client, toChannel }) => {
        if (client.isSelf() || // Ignore self
            !toChannel) return; // If client disconnected

        if (rentInstanceActive()) {
            const owner = rentInstanceOwner();
            if (owner && client.equals(owner)) {
                log(`Following owner - ${owner.nick()}`);
                followOwner();
            }
        }
    });

    /***************************
    /     RENT MANAGEMENT      /
    ***************************/

    /**
     * Creates a new rent, if conditions are met
     *
     * @param   {Client}  client 
     *
     */
    function rentMake(client) {
        if (rentHasAny(client)) {
            log(`${client.nick()} can't rent a bot, whilst renting bot already!`);
            return client.chat("You are already renting a bot!");
        }
        if (rentOnCooldown(client)) {
            log(`${client.nick()} can't rent a bot, because there is a cooldown!`);
            return client.chat("You need to wait before renting bot again!")
        }
        if (rentInstanceActive()) {
            log(`${client.nick()} can't rent a bot that is currently being "rented"!`);
            return client.chat("Rent is currently active on this bot!");
        }

        rentSave(client);
        followOwner();
    }

    /**
     * Saves new rent client
     *
     * @param   {Client}  client
     *
     */
    function rentSave(client) {
        const rentData = rentGet();

        log(client.nick() + ` - saving rent! (Rent till: ${new Date(Date.now() + RENT_TIME)})`);

        rentData[BOT_UID] = {
            uid: client.uid(),
            endTime: Date.now() + RENT_TIME
        };

        log(client.nick() + ` - starting cooldown!`);

        rentSet(rentData);
        rentSetCooldown(client);

        client.chat("Rent started!");
    }

    /**
     * Returns global rent data
     *
     * @return  {Object}  Rent data
     */
    function rentGet() {
        log(`Rent data: ${JSON.stringify(store.getGlobal(KEY_RENT))}`);
        return store.getGlobal(KEY_RENT) || {};
    }

    /**
     * Sets global rent data
     *
     * @param   {Object}  data  Rent data
     *
     */
    function rentSet(data) {
        log("Saving rent data..");
        store.setGlobal(KEY_RENT, data);
    }

    /**
     * Checks whether client rent is on cooldown
     *
     * @param   {Client}  client  Client to check
     *
     * @return  {Boolean}        
     */
    function rentOnCooldown(client) {
        log(`${client.nick()} rent is on cooldown!`);
        const cooldownData = store.getGlobal(KEY_COOLDOWN) || {};
        return cooldownData[client.uid()] > Date.now();
    }

    /**
     * Starts a rent cooldown on a client based on the configuration
     *
     * @param   {Client}  client  
     *         
     */
    function rentSetCooldown(client) {
        const cooldownData = store.getGlobal(KEY_COOLDOWN) || {};

        cooldownData[client.uid()] = Date.now() + RENT_TIME + RENT_COOLDOWN;

        log(client.nick() + ` - cooldown ends on ${new Date(cooldownData[client.uid()])}!`);

        store.setGlobal(KEY_COOLDOWN, cooldownData);
    }

    /**
     * Checks whether client has any bot rent currenctly active
     *
     * @param   {Client}  client
     *
     * @return  {Boolean}
     */
    function rentHasAny(client) {
        const uid = client.uid();
        const rentData = rentGet();
        let has = false;


        Object.keys(rentData).forEach(key => {
            if (rentData[key])
                if (rentData[key].uid === uid)
                    if (rentData[key].endTime > Date.now())
                        has = true;
        });

        log(`${client.nick()} has ${(has) ? "some" : "none"} rent active!`);

        return has;
    }

    /**
     * Checks whether THIS instance bot's rent is currently active
     *
     * @return  {Boolean}
     */
    function rentInstanceActive() {
        const rentData = rentGet();
        const instanceRentData = rentData[BOT_UID] || {};
        const active = instanceRentData.endTime > Date.now();

        log(`This instance rent ${(active) ? "is" : "isn't"} active!`);

        return active;
    }

    /**
     * Returns rent owner client
     *
     * @return  {Client}
     */
    function rentInstanceOwner() {
        const rentData = rentGet();
        const instanceRentData = rentData[BOT_UID] || {};
        const owner = backend.getClientByUID(instanceRentData.uid || "");
        log(`Current rent owner is ${(owner) ? owner.nick() : "offline"}`);
        return owner;
    }

    /**
     * Bot will join the channel where it's current rent owner is
     *
     */
    function followOwner() {
        const owner = rentInstanceOwner();

        if (owner) {
            const ownerChannel = owner.getChannels()[0];
            log(`Trying to follow the owner..`);
            backend.getBotClient().moveTo(ownerChannel);
        } else log(`Can not follow owner, went invisible/offline.`);
    }

    /**
     * Refresh rent status ((if the bot is not being rented, reset him)
     *
     */
    function rentRefreshBot() {
        if (backend.isConnected() && !rentInstanceActive()) {
            log(`Resetting bot channel (bot not being rented)!`);
            backend.getBotClient().moveTo(RENT_DEFAULT_CHANNEL);
            media.stop();
        }
    }

    /**
     * Checks if client is the rent owner
     */

    /***************************
    /     MUSIC MANAGEMENT     /
    ***************************/

    function choosePlaylist(client, playlistID) {
        if (rentInstanceActive()) {
            const owner = rentInstanceOwner();

            if (owner && owner.equals(client)) {
                if (!playlistID) // If no playlist specified
                {
                    log(`Listing playlist for the owner - ${client.nick()}`);

                    const playlists = media.getPlaylists(); //.filter(p => p); // mby add filter
                    const list = playlists.map(p => `[b]Playlist name:[/b] ${p.name()} [b]ID:[/b] [i]${p.id()}[/i]`);

                    client.chat(`Playlists (${playlists.length}):\n${list.join("\n")}`);
                } else {
                    playlist = media.getPlaylistByID(playlistID);

                    if (!playlist) return client.chat("Invalid playlist ID!");
                    else {
                        playlist.setActive();
                        client.chat("Playlist changed!");
                        log(`Owner changed playlist to ${playlist.name()}`)
                    }
                }
            }
        }
    }

    function chooseRadio(client, radioName) {
        if (rentInstanceActive()) {
            const owner = rentInstanceOwner();

            if (owner && owner.equals(client)) {
                if (!radioName) // If no playlist specified
                {
                    log(`Listing radios for the owner - ${client.nick()}`);

                    const list = Object.keys(RADIOS).map(radioName => `[b]Radio name:[/b] ${radioName}`);

                    client.chat(`Radios (${list.length}):\n${list.join("\n")}`);
                } else {
                    const radioURL = RADIOS[radioName.toLowerCase()];

                    if (!radioURL) return client.chat("Invalid radio name!");
                    else {
                        client.chat(`Loading [b]${radioName}[/b] radio..`);

                        const success = !!media.playURL(radioURL);

                        if (success) {
                            client.chat(`Radio [b]${radioName}[/b] succesfully started!`);
                            log(`Owner changed radio to ${radioName.toLowerCase()}`)
                        } else {
                            client.chat(`Error with the radio [b]${radioName}[/b], contact administrator!`);
                            log(`Owner unsuccessfully tried changing radio to ${radioName.toLowerCase()}`);
                        }
                    }
                }
            }
        }
    }

    engine.log(`*** SUCCESS *** Script: "${name}" Version: "${version}" Author: "${author}"`);
});