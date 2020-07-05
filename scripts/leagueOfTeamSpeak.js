registerPlugin({
    name: "League of TeamSpeak",
    version: "0.0.1",
    description: "League of Legends TeamSpeak Integration",
    author: "DrWarpMan <drwarpman@gmail.com>",
    backends: ["ts3"],
    engine: ">= 1.0",
    autorun: false,
    enableWeb: false,
    hidden: false,
    requiredModules: ["http"],
    voiceCommands: [],
    vars: [{
        name: "apiKey",
        type: "password",
        title: "Riot Games API key:",
        placeholder: "RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        default: ""
    }]
}, (_, config, { name, version, author }) => {

    const backend = require("backend");
    const engine = require("engine");
    const http = require("http");
    const event = require("event");
    const store = require("store");

    const { apiKey } = config;


    const _apiURL = "https://%REGION%.api.riotgames.com";

    const _region = "ALL";

    const _msgError = "ERROR";
    const _msgSummonerNotFound = "NOT_FOUND";
    const _msgInvalidSyntax = "SYNTAX";
    const _msgRegionInvalid = "REGION";
    const _msgSummonerAlreadyAdded = "ALREADYADDED";
    const _msgSummonerAlreadyOwned = "ALREADYOWNED";
    const _msgSummonerNotAdded = "NOTADDED";
    const _msgSummonerRemoved = "REMOVED";
    const _msgSummonerAlreadyVerified = "ALREADYVERIFIED";
    const _msgSummonerVerified = "VERIFIED";
    const _msgSummonerIconBad = "ICONBAD";
    const _msgSummonerNameBad = "NAMEBAD";

    const _verifyTime = 60;

    const regions = {
        BR: "BR1",
        EUNE: "EUN1",
        EUWE: "EUW1",
        JP: "JP1",
        KR: "KR",
        LAN: "LA1",
        LAS: "LA2",
        NA: "NA1",
        OCE: "OC1",
        RU: "RU",
        TR: "TR1"
    }

    config.cmdAccountAdd = "!add";
    config.cmdAccountVerify = "!ver";
    config.cmdAccountRemove = "!rem";

    const verifyTimer = {};

    const verifyIcons = {
        6: "Tibers Paw",
        7: "Red Rose",
        28: "Tiny Tibbers"
    };

    event.on("chat", async({ text, client, mode }) => {
        const msg = text.split(" ").filter(i => /\s/.test(i) === false && i.length > 0);
        const command = msg[0].toLowerCase();
        const args = msg.slice(1);

        if (client.isSelf()) return;
        if (mode != 1) return;

        switch (command) {
            case config.cmdAccountAdd:
                {
                    if (args.length <= 0) return client.chat(_msgInvalidSyntax);

                    const summonerName = (_region !== "ALL") ? args.join(" ") : args.slice(0, args.length - 1).join(" ");
                    const region = regions[(_region !== "ALL") ? _region : args[args.length - 1].toUpperCase()];

                    if (!summonerName || (summonerName && summonerName.length <= 1)) return client.chat(_msgSummonerNameBad);
                    if (typeof region === "undefined") return client.chat(_msgRegionInvalid);

                    const httpParams = {
                        method: "GET",
                        timeout: 5 * 1000,
                        url: regionAPI(region) + `/lol/summoner/v4/summoners/by-name/${encodeURI(summonerName)}?api_key=${apiKey}`
                    };

                    try {
                        const { error, response } = await httpRequest(httpParams);

                        if (error) throw new Error(`Error: ${error}`);

                        if (response.statusCode == 404) return client.chat(_msgSummonerNotFound);
                        if (response.statusCode != 200) throw new Error(`HTTP Error (${httpParams.url}) - Status [${response.statusCode}]: ${response.status}`);

                        client.chat("Account found: " + JSON.stringify(JSON.parse(response.data)));

                        const account = JSON.parse(response.data);

                        if (accountAlreadyAdded(client)) return client.chat(_msgSummonerAlreadyAdded);
                        if (accountAlreadyOwned(account, region)) return client.chat(_msgSummonerAlreadyOwned);

                        setAccount(client, account, region);

                        const { expiryDate, verifyIconId } = startVerifyTimer(client, account.profileIconId);

                        client.chat(`EXP: ${expiryDate} ICON DESCRIPTION: ${verifyIcons[verifyIconId]}`);
                    } catch (err) {
                        console.log(err);
                        engine.log(err.toString());
                        client.chat(_msgError);
                    } finally {
                        // antispam
                    }
                }
                break;
            case config.cmdAccountVerify:
                {
                    if (!accountAlreadyAdded(client)) return client.chat(_msgSummonerNotAdded);
                    if (hasAccountVerified(client)) return client.chat(_msgSummonerAlreadyVerified);

                    const { expiryDate, verifyIconId } = getVerifyTimer(client);

                    try {
                        if (expiryDate && expiryDate > Date.now()) {
                            const { success, found, error } = await updateAccount(client);

                            if (!success) throw error;
                            if (!found) throw error;

                            const { account, region } = getAccount(client);

                            if (account.profileIconId != verifyIconId) return client.chat(_msgSummonerIconBad);

                            verifyAccount(client);
                            removeVerifyTimer(client);
                            removeDuplicatedAccounts(account, region);

                            client.chat(_msgSummonerVerified);
                        } else {
                            const { success, found, error } = await updateAccount(client);

                            if (!success) throw error;
                            if (!found) throw error;

                            const { account } = getAccount(client);
                            const { expiryDate, verifyIconId } = startVerifyTimer(client, account.profileIconId);

                            client.chat(`EXP: ${expiryDate} ICON DESCRIPTION: ${verifyIcons[verifyIconId]}`);
                        }
                    } catch (err) {
                        console.log(err);
                        engine.log(err.toString());
                        client.chat(_msgError);
                    } finally {
                        // antispam
                    }
                }
                break;
            case config.cmdAccountRemove:
                {
                    if (accountAlreadyAdded(client)) {
                        removeAccount(client);
                        client.chat(_msgSummonerRemoved);
                    } else return client.chat(_msgSummonerNotAdded);
                }
                break;
            default:
                return;
        }
    });

    function httpRequest(params) {
        return new Promise(
            (resolve, reject) => {
                try {
                    http.simpleRequest(params, (error, response) => {
                        return resolve({
                            "error": error,
                            "response": response
                        });
                    });
                } catch (err) {
                    reject(err);
                }
            }
        );
    }

    function regionAPI(region) {
        return _apiURL.replace("%REGION%", region);
    }

    function setAccount(client, account, region, verified = false) {
        const uid = client.uid();

        store.set(uid, {
            "account": account,
            "region": region,
            "verified": verified
        });
    }

    function getAccount(client) {
        const uid = client.uid();

        return store.get(uid);
    }

    function removeAccount(client) {
        const uid = client.uid();
        store.unset(uid);
    }

    function removeDuplicatedAccounts(targetAccount, targetRegion) {
        store.getKeys().forEach(key => {
            const { account, region, verified } = store.get(uid);

            if (verified === false && region === targetRegion && account.puuid === targetAccount.puuid)
                store.unset(key);
        });
    }

    function hasAccountVerified(client) {
        const uid = client.uid();
        const accountData = store.get(uid);

        return accountData.verified == true;
    }

    function accountAlreadyOwned(targetAccount, targetRegion) {
        return store.getKeys().some(uid => {
            const { account, region, verified } = store.get(uid);

            return verified === true && region === targetRegion && account.puuid === targetAccount.puuid;
        });
    }

    function accountAlreadyAdded(client) {
        const accountData = store.get(client.uid());
        return !!accountData || accountData && accountData.account;
    }

    function verifyAccount(client) {
        const uid = client.uid();
        const accountData = store.get(uid);

        accountData.verified = true;

        store.set(uid, accountData);
    }

    function startVerifyTimer(client, profileIconId) {
        const uid = client.uid();
        const icons = Object.keys(verifyIcons).filter(iconId => iconId != profileIconId);
        const verifyIconId = icons[Math.floor(Math.random() * icons.length)];

        return verifyTimer[uid] = {
            "expiryDate": Date.now() + _verifyTime * 1000,
            "verifyIconId": verifyIconId
        }
    }

    function getVerifyTimer(client) {
        const uid = client.uid();
        return verifyTimer[uid];
    }

    function removeVerifyTimer(client) {
        const uid = client.uid();
        delete verifyTimer[uid];
    }

    async function updateAccount(client) {
        const uid = client.uid();
        const { account, region, verified } = store.get(uid);

        const result = {
            "success": true,
            "found": true,
            "error": false
        };

        const httpParams = {
            method: "GET",
            timeout: 5 * 1000,
            url: regionAPI(region) + `/lol/summoner/v4/summoners/by-puuid/${encodeURI(account.puuid)}?api_key=${apiKey}`
        };

        try {
            const { error, response } = await httpRequest(httpParams);

            if (error) throw new Error(`Error: ${error}`);

            if (response.statusCode == 404) {
                removeAccount(client)
                result.found = false;
                result.error = new Error("Summoner not found -> removing account data!");
            }

            if (response.statusCode != 200) throw new Error(`HTTP Error (${httpParams.url}) - Status [${response.statusCode}]: ${response.status}`);

            const account = JSON.parse(response.data);

            setAccount(client, account, region, verified);
        } catch (err) {
            console.log(err);
            engine.log(err.toString());
            result.success = false;
            result.error = err;
        } finally {
            return result;
        }
    }

    // SCRIPT LOADED SUCCCESFULLY
    engine.log(`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`);
});
