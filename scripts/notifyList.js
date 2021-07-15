registerPlugin({
    name: "Notify List",
    version: "1.0.0",
    description: "Get notified when a specific client joins the server",
    author: "DrWarpMan <drwarpman@gmail.com>",
    backends: ["ts3"],
    engine: ">= 1.0",
    autorun: false,
    enableWeb: false,
    hidden: false,
    requiredModules: ["http"],
    voiceCommands: [],
    vars: [{
        name: "logEnabled",
        type: "checkbox",
        title: "Check to enable detailed logs",
        default: false
    }, {
        name: "serverName",
        type: "string",
        title: "Server name:",
        default: "Unknown"
    }]
}, (_, config, { name, version, author }) => {

    const engine = require("engine");
    const event = require("event");
    const store = require("store");
    const backend = require("backend");
    const http = require("http");

    /***************************
    /     CONFIGURATION        /
    ***************************/

    const {} = config;

    /***************************
    /     INIT                 /
    ***************************/

    const NL_LIST_PREFIX = "nldata";

    const NL_COOLDOWNS_ALL = {};
    const NL_COOLDOWN_TIME = 60 * 1000;

    const NL_PBTOKEN_PREFIX = "pbToken";

    engine.log(`*** LOADING *** Script: "${name}" Version: "${version}" Author: "${author}"`);

    const log = msg => !!config.logEnabled && engine.log(msg);

    /***************************
    /     APP                  /
    ***************************/

    event.on("load", () => {
        const command = require("command")
        if (!command) throw new Error("command.js library not found! Please download command.js and enable it to be able use this script!")
        const nickDB = require("nickDatabase");
        if (!nickDB) throw new Error('nickDatabase.js library not found! Please download nickDatabase.js and enable it to be able use this script!');

        const nlCommand = command.createCommandGroup("nl")
            .help("manages notification list, use [b]!man nl <subCommand>[/b] for more information")
            .exec((client, args, reply) => {
                reply("Use [b]!man nl[/b] or [b]!man nl <subCommand>[/b] for more information")
            });

        nlCommand.addCommand("list")
            .help("Shows your current notification list (clients)")
            .exec((client, args, reply) => {
                const { added } = nlDataGet(client.uid());
                const list = Object.keys(added).map((addedUID, index) => `[b]${index+1}.[/b] ${nickURL(addedUID)} (${addedUID})`)
                    .join("\n");

                reply(`Added list (${Object.keys(added).length}):\n${list}`);
            });

        nlCommand.addCommand("add")
            .help("Adds a client to your notification list")
            .manual("As an identificator for the target client to add you can use either UID or client URL by dragging the client in the bot chat")
            .manual("Notification arguments - chat, poke, pushbullet must be filled with values either [b]1[/b] or [b]0[/b] values (1 = yes, 0 = no)")
            .manual("")
            .manual(`[i]Example:[/i] ${command.getCommandPrefix()}${nlCommand.getCommandName()} add [b]1[/b] 0 [b]1[/b] [url=client://0/x]Client URL[/url]`)
            .manual("Previous command would make the bot notify you via [b]chat[/b] & [b]pushbullet[/b] when a specific client joins the server")
            .addArgument(args => args.number.setName("chatNotify")
                .min(0)
                .max(1)
                .integer())
            .addArgument(args => args.number.setName("pokeNotify")
                .min(0)
                .max(1)
                .integer())
            .addArgument(args => args.number.setName("pushbulletNotify")
                .min(0)
                .max(1)
                .integer())
            .addArgument(args => args.client.setName("target"))
            .exec((client, { target: targetUID, chatNotify, pokeNotify, pushbulletNotify }, reply) => {
                if (targetUID === client.uid())
                    return reply("You can not add yourself!");
                if ([targetUID, chatNotify, pokeNotify].every(val => val === 0))
                    return reply("You have to choose at least one notification method!");

                const targetClient = backend.getClientByUID(targetUID) || nickDB.getNick(targetUID);

                if (targetClient !== false) {
                    const settings = {
                        chatNotify,
                        pokeNotify,
                        pushbulletNotify
                    };

                    if (nlDataAdd(client, targetUID, settings))
                        return reply("Target added succesfully!");
                    else
                        return reply("Target could not be added!");
                } else {
                    return reply("Target not found on this server!");
                }
            });

        nlCommand.addCommand("rem")
            .help("Removes a client from your notification list")
            .manual("As an identificator for the target client to remove you can use either UID or client URL by dragging the client in the bot chat")
            .addArgument(args => args.client.setName("target"))
            .alias("remove", "delete", "del")
            .exec((client, { target: targetUID }, reply) => {
                if (nlDataRem(client, targetUID))
                    return reply("Target removed succesfully!");
                else
                    return reply("Target could not be removed!");
            });

        nlCommand.addCommand("pushbullet")
            .help("Sets the pushbullet API key, so that the bot can send you notifications through Pushbullet")
            .manual("API key can be generated here: https://www.pushbullet.com/#settings/account")
            .alias("pb")
            .addArgument(args => args.string.setName("token").max(34).min(34))
            .exec(async(client, { token }, reply) => {
                if (await nlPbTokenCheck(token)) {
                    nlPbTokenSet(client.uid(), token);
                    return reply("Pushbullet token succesfully saved!");
                } else {
                    return reply("There was an error while saving your Pushbullet token, if you think this is an error, contact an administrator!");
                }
            });

        event.on("clientMove", ({ client, fromChannel }) => {
            if (client.isSelf()) return; // Ignore self

            // If connected
            if (!fromChannel) {
                const uid = client.uid();
                const { addedby } = nlDataGet(uid);

                if (addedby.length >= 1) {
                    addedby.forEach(addedbyUID => {
                        if (!nlOnCooldown(uid, addedbyUID)) {
                            const { added } = nlDataGet(addedbyUID);
                            const settings = added[uid];

                            Object.keys(settings).forEach(methodName => {
                                const methodValue = settings[methodName];
                                if (methodValue) notify(addedbyUID, methodName, client);
                            });

                            nlSetCooldown(uid, addedbyUID);
                        }
                    });
                }
            }
        });

        function notify(uid, method, targetClient) {
            const client = backend.getClientByUID(uid);
            switch (method) {
                case "chatNotify":
                    if (!client) return;
                    client.chat(`>>> ${nickURL(targetClient.uid(), targetClient.nick())} has just joined the server!`);
                    break;
                case "pokeNotify":
                    if (!client) return;
                    client.poke(`>>> [b]${targetClient.nick()}[/b] has joined the server! (${targetClient.uid()})`);
                    break;
                case "pushbulletNotify":
                    const token = nlPbTokenGet(uid);
                    if (token !== false) nlPbNotificationSend(uid, token, targetClient);
                    break;
                default:
                    throw new Error(`Invalid method: ${method}`);
            }
        }

        function nlDataGet(uid) {
            return store.get(NL_LIST_PREFIX + uid) || { added: {}, addedby: [] };
        }

        function nlDataSet(uid, data) {
            return store.set(NL_LIST_PREFIX + uid, data);
        }

        function nlDataAdd(client, targetUID, settings) {
            const clientUID = client.uid();
            const clientData = nlDataGet(clientUID);

            if (Object.keys(clientData.added).includes(targetUID)) {
                client.chat("Target is already in the list!");
                return;
            } else {
                clientData.added[targetUID] = settings;
            }

            const targetData = nlDataGet(targetUID);
            if (!targetData.addedby.includes(clientUID)) targetData.addedby.push(clientUID);

            nlDataSet(clientUID, clientData);
            nlDataSet(targetUID, targetData);

            return true;
        }

        function nlDataRem(client, targetUID) {
            const clientUID = client.uid();
            const clientData = nlDataGet(clientUID);

            if (!Object.keys(clientData.added).includes(targetUID)) {
                client.chat("Target isn't in your notification list!");
                return false;
            } else {
                delete clientData.added[targetUID];

                const targetData = nlDataGet(targetUID);
                targetData.addedby = targetData.addedby.filter(uid => uid !== clientUID);

                nlDataSet(clientUID, clientData);
                nlDataSet(targetUID, targetData);

                return true;
            }
        }

        function nlOnCooldown(uid, addedbyUID) {
            const cooldowns = NL_COOLDOWNS_ALL[uid] || {};
            if (Object.keys(cooldowns).length <= 0) return false;
            else {
                return (cooldowns[addedbyUID] || 0) > Date.now();
            }

        }

        function nlSetCooldown(uid, addedbyUID) {
            if (!NL_COOLDOWNS_ALL[uid]) NL_COOLDOWNS_ALL[uid] = {};
            NL_COOLDOWNS_ALL[uid][addedbyUID] = Date.now() + NL_COOLDOWN_TIME;
        }


        function nlPbTokenGet(uid) {
            return store.get(NL_PBTOKEN_PREFIX + uid) || false;
        }

        function nlPbTokenSet(uid, token) {
            return store.set(NL_PBTOKEN_PREFIX + uid, token);
        }

        function nlPbTokenDelete(uid) {
            return store.unset(NL_PBTOKEN_PREFIX + uid);
        }

        async function nlPbTokenCheck(token) {
            const httpParams = {
                method: "GET",
                timeout: 5 * 1000,
                url: `https://api.pushbullet.com/v2/users/me`,
                headers: {
                    "Access-Token": token
                }
            };

            try {
                const { error, response } = await httpRequest(httpParams);
                if (error) throw new Error(error);
                else {
                    log(JSON.stringify(response));
                    if (response.statusCode !== 200)
                        throw new Error("Status code: " + response.statusCode);
                    else
                        return true;
                }
            } catch (err) {
                console.log(err);
                log(err);
                return false;
            }
        }

        async function nlPbNotificationSend(uid, token, targetClient) {
            const httpParams = {
                method: "POST",
                timeout: 5 * 1000,
                url: `https://api.pushbullet.com/v2/pushes`,
                headers: {
                    "Access-Token": token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "body": config.serverName || "Unknown",
                    "title": targetClient.nick() + " joined the server!",
                    "type": "note"
                })
            };

            try {
                const { error, response } = await httpRequest(httpParams);
                if (error) throw new Error(error);
                else {
                    log(JSON.stringify(response));
                    if (response.statusCode !== 200) {
                        nlPbTokenDelete(uid);
                        throw new Error("Status code: " + response.statusCode);
                    } else
                        return true;
                }
            } catch (err) {
                console.log(err);
                log(err);
                return false;
            }
        }

        function nickURL(uid, nick = "") {
            nick = nick || nickDB.getNick(uid);
            return `[URL=client://0/${uid}~${nick}]${nick}[/URL]`;
        }

        function httpRequest(params) {
            return new Promise(
                (resolve, reject) => {
                    try {
                        http.simpleRequest(params, (error, response) => {
                            return resolve({ error, response });
                        });
                    } catch (err) {
                        reject(err);
                    }
                }
            );
        }

        engine.log(`*** SUCCESS *** Script: "${name}" Version: "${version}" Author: "${author}"`);
    });
});