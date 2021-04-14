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
    }, {
        name: "botUIDs",
        type: "strings",
        title: "UIDs of all bots using this script:",
        default: []
    }, {
        name: "rentTime",
        type: "number",
        title: "How long can a bot be rented for? (in minutes):",
        default: 120,
        placeholder: "120"
    }, {
        name: "rentCooldown",
        type: "number",
        title: "How long should one wait between bot rents? (in minutes):",
        default: 30,
        placeholder: "30"
    }, {
        name: "rentDepo",
        type: "number",
        title: "Default channel for the bot:",
        default: 0,
        placeholder: "69"
    }, {
        name: "ignoreChannelIDs",
        type: "strings",
        title: "Ignore channel IDs:", // subchannels?
        default: []
    }, {
        name: "groupIDs",
        type: "strings",
        title: "Group IDs (allowed to rent):",
        default: []
    }, {
        name: "blacklist",
        type: "checkbox",
        title: "Should previously list of groups be a blacklist?",
        default: false
    }, {
        name: "volume",
        type: "number",
        title: "Default volume level:",
        default: 15,
        placeholder: "15"
    }, {
        name: "radios",
        type: "array",
        title: "Radios:",
        default: [],
        vars: [{
                name: "radioName",
                type: "string",
                title: "Radio Name:"
            },
            {
                name: "radioURL",
                type: "string",
                title: "Radio URL:"
            }
        ]
    }, {
        name: "editCommands",
        title: "Edit commands?",
        type: "checkbox",
        default: false
    }, {
        name: "cmd_rent",
        type: "string",
        title: "Command for: renting the bot",
        default: "!rent",
        placeholder: "!rent",
        conditions: [{ field: 'editCommands', value: 1 }]
    }, {
        name: "cmd_help",
        type: "string",
        title: "Command for: help about the rent system",
        default: "!rent-help",
        placeholder: "!rent-help",
        conditions: [{ field: 'editCommands', value: 1 }]
    }, {
        name: "cmd_playlist",
        type: "string",
        title: "Command for: starting a playlist",
        default: "!pl",
        placeholder: "!pl",
        conditions: [{ field: 'editCommands', value: 1 }]
    }, {
        name: "cmd_radio",
        type: "string",
        title: "Command for: starting a radio",
        default: "!radio",
        placeholder: "!radio",
        conditions: [{ field: 'editCommands', value: 1 }]
    }, {
        name: "cmd_youtube",
        type: "string",
        title: "Command for: playing youtube URL",
        default: "!youtube",
        placeholder: "!youtube",
        conditions: [{ field: 'editCommands', value: 1 }]
    }, {
        name: "cmd_stop",
        type: "string",
        title: "Command for: stopping the playback",
        default: "!stop",
        placeholder: "!stop",
        conditions: [{ field: 'editCommands', value: 1 }]
    }, {
        name: "cmd_volume",
        type: "string",
        title: "Command for: setting the volume level",
        default: "!level",
        placeholder: "!level",
        conditions: [{ field: 'editCommands', value: 1 }]
    }, {
        name: "cmd_quit",
        type: "string",
        title: "Command for: cancelling the bot",
        default: "!quit",
        placeholder: "!quit",
        conditions: [{ field: 'editCommands', value: 1 }]
    }]
}, (_, config, { name, version, author }) => {

    const engine = require("engine");
    const event = require("event");
    const store = require("store");
    const backend = require("backend");
    const media = require("media");
    const audio = require("audio");

    /***************************
    /     CONFIGURATION        /
    ***************************/

    const { botUIDs, rentTime, rentCooldown, rentDepo, ignoreChannelIDs, groupIDs, blacklist, radios, volume } = config;
    const RENT_TIME = (rentTime || 120) * 60 * 1000; // in minutes
    const RENT_COOLDOWN = (rentCooldown || 120) * 60 * 1000; // in minutes
    const RENT_DEFAULT_CHANNEL = (rentDepo || "0"); // ID
    const IGNORE_CHANNELS = (ignoreChannelIDs || []);
    const GROUP_IDS = (groupIDs || []);
    const BL = blacklist || false;
    const VOLUME = volume || 15;
    const RADIOS = {};
    (radios || []).forEach(({ radioName, radioURL }) => RADIOS[radioName.toLowerCase()] = radioURL);
    const CMD = {
        RENT: config.cmd_rent,
        HELP: config.cmd_help,
        PLAYLIST: config.cmd_playlist,
        RADIO: config.cmd_radio,
        QUIT: config.cmd_quit,
        YOUTUBE: config.cmd_youtube,
        STOP: config.cmd_stop,
        VOLUME: config.cmd_volume
    };

    /***************************
    /     INIT                 /
    ***************************/

    engine.log(`*** LOADING *** Script: "${name}" Version: "${version}" Author: "${author}"`);

    const log = msg => !!config.logEnabled && engine.log(msg);

    const KEY_RENT = "rentalbot";
    const KEY_COOLDOWN = "rentalcooldown";
    const RENT_CHECK_INTERVAL = 60 * 1000;

    const ERROR = "[b][Error][/b]";
    const INFO = "[b][Info][/b]";
    const SUCCESS = "[b][Success][/b]";

    let BOT_UID = (backend.isConnected()) ? backend.getBotClient().uid() : "";

    setInterval(rentRefreshBot, RENT_CHECK_INTERVAL);

    /***************************
    /     EVENTS               /
    ***************************/

    event.on("connect", () => {
        BOT_UID = backend.getBotClient().uid();
        media.stop(); // radio fix? volume 0 and 100 mby?
    });

    event.on("chat", ({ client, mode, text }) => {
        if (client.isSelf() || // Ignore self
            mode !== 1) // Watch only private chat
            return;

        const msg = text.split(" ").filter(i => /\s/.test(i) === false && i.length > 0);
        const command = msg[0];
        const args = msg.slice(1);

        switch (command) {
            case CMD.RENT:
                rentMake(client);
                break;
            case CMD.HELP:
                rentHelp(client);
                break;
            case CMD.RADIO:
                chooseMusic(client, "radio", args[0]);
                break;
            case CMD.YOUTUBE:
                chooseMusic(client, "youtube", args[0]);
                break;
            case CMD.PLAYLIST:
                chooseMusic(client, "playlist", args[0]);
                break;
            case CMD.STOP:
                chooseMusic(client, "stop");
                break;
            case CMD.VOLUME:
                changeVolume(client, args[0]);
                break;
            case CMD.QUIT:
                rentQuit(client);
                break;
            default:
                return;
        }
    });

    event.on("clientMove", ({ client, toChannel }) => {
        if (client.isSelf() || // Ignore self
            !toChannel || // If client disconnected
            backend.getBotClient().getChannels()[0].equals(toChannel)) // If bot is already in the channel
            return;

        if (rentInstanceActive()) {
            const owner = rentInstanceOwner();
            if (owner && client.equals(owner)) {
                if (!IGNORE_CHANNELS.includes(toChannel.id())) {
                    if (!anyBotsInChannel(toChannel)) {
                        log(`Following owner - ${owner.nick()}`);
                        followOwner();
                    }
                }
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
            return client.chat(`${ERROR} You are already renting a bot!`);
        }
        if (rentOnCooldown(client)) {
            log(`${client.nick()} can't rent a bot, because there is a cooldown!`);
            return client.chat(`${ERROR} You need to wait before renting bot again!`)
        }
        if (rentInstanceActive()) {
            log(`${client.nick()} can't rent a bot that is currently being "rented"!`);
            return client.chat(`${ERROR} Rent is currently active on this bot!`);
        }
        if (!rentAllowed(client)) {
            log(`${client.nick()} can't rent a bot, cause he ain't allowed to!`);
            return client.chat(`${ERROR} You are not allowed to rent a bot!`);
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
        rentSetCooldown(client, rentData[BOT_UID].endTime + RENT_COOLDOWN);
        audio.setVolume(VOLUME);
        media.stop();

        client.chat(`${SUCCESS} Rent started!`);
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
    function rentSetCooldown(client, endDate) {
        const cooldownData = store.getGlobal(KEY_COOLDOWN) || {};

        cooldownData[client.uid()] = endDate;

        log(client.nick() + ` - cooldown ends on ${new Date(endDate)}!`);

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
            log(`Resetting bot channel (bot is not being rented)!`);
            backend.getBotClient().moveTo(RENT_DEFAULT_CHANNEL);
            media.stop();
        }
    }

    /**
     * Checks if client is allowed (has specified groups) to rent a bot
     *
     * @param   {Client}  client  
     *
     * @return  {Boolean}
     */
    function rentAllowed(client) {
        const groups = client.getServerGroups().map(g => g.id());

        return (BL) ?
            groups.every(gID => !GROUP_IDS.includes(gID)) :
            groups.some(gID => GROUP_IDS.includes(gID));
    }

    /**
     * Quits the rent and refreshes the bot (if the owner called it)
     *
     * @param   {Client}  client
     *
     */
    function rentQuit(client) {
        if (!rentHasAny(client)) return client.chat(`${ERROR} You do not have a rent!`);
        if (!rentInstanceActive()) return client.chat(`${ERROR} This instance does not have a rent!`);

        const owner = rentInstanceOwner();
        if (owner && client.equals(owner)) {
            rentSet({});
            rentRefreshBot();
            log(`${client.nick()} quit the rent!`);
            client.chat(`${SUCCESS} You have just cancelled your rent!`);
        } else client.chat(`${ERROR} You are not the owner!`);
    }

    /**
     * Gives information on how to use the bot, for the client
     *
     * @param   {Client}  client
     *
     */
    function rentHelp(client) {
        const helpText = `${INFO} How to use the bot?
You can rent a bot via the following command: [b]${CMD.RENT}[/b]
Then you can control the music the way you like!

Available commands to manage music:
[b]${CMD.RADIO}[/b] <radioName> - list all radios or play a specific radio by it's name
[b]${CMD.PLAYLIST}[/b] <playlistID> - list all playlists or play a specific playlist by ID
[b]${CMD.YOUTUBE}[/b] <url> - play youtube URL
[b]${CMD.VOLUME}[/b] <level> - set the volume level of the bot
[b]${CMD.STOP}[/b] - stops the playback

If you want, you can cancel the bot via [b]${CMD.QUIT}[/b]`;

        client.chat(helpText);
    }

    /**
     * Checks if client is the rent owner
     */

    /***************************
    /     MUSIC MANAGEMENT     /
    ***************************/

    /**
     * Plays music by it's identificator and type
     *
     * @param   {Client}  client         
     * @param   {String}  type           radio, youtube, playlist
     * @param   {String}  identificator  id, url, etc.
     *
     */
    function chooseMusic(client, type, identificator = false) {
        if (!rentInstanceActive()) return client.chat(`${ERROR} Rent is not active on this instance!`);

        const owner = rentInstanceOwner();
        if (!owner || !owner.equals(client)) return client.chat(`${ERROR} You are not the owner!`);

        switch (type) {
            case "radio":
                if (!identificator) {
                    const radios = Object.keys(RADIOS).map(radioName => `[b]Radio name:[/b] ${radioName}`);
                    log(`Listing radios for the owner - ${client.nick()}`);
                    client.chat(`${INFO} Radios (${radios.length}):\n${radios.join("\n")}`);
                } else {
                    const radio = RADIOS[identificator.toLowerCase()];

                    if (!!radio) {
                        client.chat(`${INFO} Loading [b]${identificator}[/b] radio..`);

                        const success = !!media.playURL(radio);

                        if (success) {
                            log(`Owner changed radio to ${identificator.toLowerCase()}`)
                            client.chat(`${SUCCESS} Radio [b]${identificator}[/b] succesfully started!`);
                        } else {
                            log(`Owner unsuccessfully tried changing radio to ${identificator.toLowerCase()}`);
                            client.chat(`${ERROR} Corrupted radio [b]${identificator}[/b], contact administrator!`);
                        }
                    } else client.chat(`${ERROR} Invalid radio name!`);
                }
                break;
            case "playlist":
                if (!identificator) {
                    const playlists = media.getPlaylists() /*filter*/ .map(p => `[b]Playlist name:[/b] ${p.name()}`);
                    log(`Listing playlists for the owner - ${client.nick()}`);
                    client.chat(`${INFO} Playlists (${playlists.length}):\n${playlists.join("\n")}`);
                } else {
                    const playlist = media.getPlaylists().find(playlist => playlist.name().toLowerCase() === identificator.toLowerCase());
                    if (!!playlist /* if found */ ) {
                        playlist.setActive();
                        media.playlistPlayByID(playlist, 0);
                        log(`Owner changing playlist to ${playlist.name()}`);
                        client.chat(`${SUCCESS} Playlist changed!`);
                    } else client.chat(`${ERROR} Invalid playlist ID!`);
                }
                break;
            case "youtube":
                if (!identificator) client.chat(`${ERROR} You have to specify a Youtube URL to play first!`);
                else {
                    const ytRegex = /^(?:https?:)?(?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch|v|embed)(?:\.php)?(?:\?.*v=|\/))([a-zA-Z0-9\_-]{7,15})(?:[\?&][a-zA-Z0-9\_-]+=[a-zA-Z0-9\_-]+)*$/;
                    if (!ytRegex.test(identificator)) return client.chat(`${ERROR} Youtube URL seems invalid!`);
                    log(`Owner ${client.nick()} is trying to play Youtube URL - ${identificator}`);
                    client.chat(`${INFO} Trying to play URL: [b]${identificator}[/b]`);
                    media.yt(stripURL(identificator));
                }
                break;
            case "stop":
                media.stop();
                log(`Owner ${client.nick()} has stopped the playback!`);
                client.chat(`${SUCCESS} Playback stopped!`);
                break;
            default:
                console.error("Error, undefined music type!");
        }
    }

    /**
     * Changes the volume of the bot
     *
     * @param   {Client}  client  Only owner
     * @param   {Integer}  level   1-100
     *
     */
    function changeVolume(client, level) {
        if (!rentInstanceActive()) return client.chat(`${ERROR} Rent is not active on this instance!`);

        const owner = rentInstanceOwner();
        if (!owner || !owner.equals(client)) return client.chat(`${ERROR} You are not the owner!`);

        if (!level) return client.chat(`${ERROR} Specify a volume level please, 0-100!`);
        else {
            if (isNaN(level)) return client.chat(`${ERROR} Specified volume level is invalid, only 0-100!`);

            audio.setVolume(level);
            log(`Owner ${client.nick()} changed volume to ${level}!`);
            client.chat(`${INFO} Volume changed to [b]${level}[/b]`);
        }
    }

    /***************************
    /     MISC / OTHER         /
    ***************************/

    /**
     * Removes TeamSpeaks URL bb-code 
     * @author Jonas Bögle (irgendwr)
     * 
     * @param {String} str
     * 
     * @return {String} str without [URL] [/URL]
     */
    function stripURL(str) {
        // don't handle non-strings, return as provided
        if (typeof str !== 'string') return str;

        // remove surrounding [URL] [/URL] tags
        let match = str.match(/\[URL\](.+)\[\/URL\]/i);
        if (match && match.length >= 2) {
            return match[1];
        }

        // if nothing matches just return str
        return str;
    }

    function anyBotsInChannel(channel) {
        return channel.getClients().map(c => c.uid()).some(uid => botUIDs.includes(uid));
    }

    engine.log(`*** SUCCESS *** Script: "${name}" Version: "${version}" Author: "${author}"`);
});