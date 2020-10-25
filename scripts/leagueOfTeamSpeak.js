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

    /* INTERFACES */

    const backend = require("backend");
    const engine = require("engine");
    const http = require("http");
    const event = require("event");
    const store = require("store");

    /* VARS */

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
    const _msgSummonerNameBad = "NAMEBAD";
    const _msgSummonerCodeInvalid = "CODEINVALID";

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

    /**
     * COMMANDS
     */

    event.on("chat", ({ text, client, mode }) => {
        const msg = text.split(" ").filter(i => /\s/.test(i) === false && i.length > 0);
        const command = msg[0].toLowerCase();
        const args = msg.slice(1);

        if (client.isSelf()) return;
        if (mode != 1) return;

        switch (command) {
            case config.cmdAccountAdd:
                cmdFuncs.accountAdd(client, args);
                break;
            case config.cmdAccountVerify:
                cmdFuncs.accountVerify(client);
                break;
            case config.cmdAccountRemove:
                cmdFuncs.accountRemove(client);
                break;
            default:
                return;
        }
    });

    const cmdFuncs = {
        async accountAdd(client, args) {

            // Run checks

            if (args.length <= 0) return client.chat(_msgInvalidSyntax);
            if (accountAlreadyAdded(client)) return client.chat(_msgSummonerAlreadyAdded);

            const summonerName = (_region !== "ALL") ? args.join(" ") : args.slice(0, args.length - 1).join(" ");
            const region = regions[(_region !== "ALL") ? _region : args[args.length - 1].toUpperCase()];

            if (!summonerName || (summonerName && summonerName.length <= 1)) return client.chat(_msgSummonerNameBad);
            if (!region) return client.chat(_msgRegionInvalid);

            // Start adding proccess

            try {
                const account = await summonerByName(summonerName);

                if (account === null) return client.chat(_msgError);
                if (account === false) return client.chat(_msgSummonerNotFound);

                if (accountAlreadyOwned(account, region)) return client.chat(_msgSummonerAlreadyOwned);
                accountSet(client, account, region);

                verifyStartMsg(client);
            } catch (err) {
                console.log(err);
                engine.log(err.toString());
                client.chat(_msgError);
            }
        },

        async accountVerify(client) {

            // Run checks

            if (!accountAlreadyAdded(client)) return client.chat(_msgSummonerNotAdded);
            if (accountVerified(client)) return client.chat(_msgSummonerAlreadyVerified);

            // Start verifying proccess

            const { expiryDate, verifyCode } = verifyGetTimer(client);

            if (expiryDate && expiryDate > Date.now()) { // Time expired?
                try {
                    const { account, region } = accountGet(client);
                    const code = await summonerGetCode(account, region)

                    if (code === null) return client.chat(_msgError);
                    if (code === false || code !== verifyCode) return client.chat(_msgSummonerCodeInvalid);

                    accountVerify(client);
                    verifyRemoveTimer(client);
                    accountRemoveDuplicates(account, region);

                    client.chat(_msgSummonerVerified);
                } catch (err) {
                    console.log(err);
                    engine.log(err.toString());
                    client.chat(_msgError);
                }
            } else { // Generate new verification code
                verifyStartMsg(client);
            }
        },

        accountRemove(client) {

            // Run checks

            if (!accountAlreadyAdded(client)) return client.chat(_msgSummonerNotAdded);

            // Start removing proccess

            const remove = accountRemove(client);

            if (remove) client.chat(_msgSummonerRemoved);
            else client.chat(_msgError);
        }
    }

    /**
     * Functions: ACCOUNT MANAGEMENT
     */

    function accountSet(client, account, region, verified = false) {
        const uid = client.uid();

        store.set(uid, {
            "account": account,
            "region": region,
            "verified": verified
        });
    }

    function accountGet(client) {
        return store.get(client.uid());
    }

    function accountRemove(client) {
        return !!store.unset(client.uid());
    }

    function accountRemoveDuplicates(targetAccount, targetRegion) {
        store.getKeys().forEach((uid /* key name */ ) => {
            const { account, region, verified } = store.get(uid);

            if (verified === false && region === targetRegion && account.puuid === targetAccount.puuid)
                store.unset(key);
        });
    }

    function accountVerified(client) {
        const accountData = store.get(client.uid());

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
        return !!accountData || (accountData && accountData.account);
    }

    function accountVerify(client) {
        const uid = client.uid();
        const accountData = store.get(uid);

        accountData.verified = true;

        return store.set(uid, accountData);
    }

    /**
     * Functions: VERIFY
     */

    function verifyStartMsg(client) {
        const { expiryDate, verifyCode } = verifyStartTimer(client);
        client.chat(`EXP: ${expiryDate} CODE: ${verifyCode}`);
    }

    function verifyStartTimer(client) {
        const code = verifyRandCode();

        return verifyTimer[client.uid()] = {
            "expiryDate": Date.now() + _verifyTime * 1000,
            "verifyCode": code
        }
    }

    function verifyGetTimer(client) {
        return verifyTimer[client.uid()] || {
            expiryDate: 0,
            verifyCode: false
        };
    }

    function verifyRemoveTimer(client) {
        delete verifyTimer[client.uid()];
    }

    function verifyRandCode() {
        return Math.random().toString(20).substr(2, 6);
    }

    /**
     * Functions: SUMMONER
     */

    async function summonerByName(summonerName) {
        let account = null;

        const httpParams = {
            method: "GET",
            timeout: 5 * 1000,
            url: regionize(region) + `/lol/summoner/v4/summoners/by-name/${encodeURI(summonerName)}?api_key=${apiKey}`
        };

        try {
            const { error, response } = await httpRequest(httpParams);

            if (error) throw new Error(`Error: ${error}`);
            if (response.statusCode == 404) account = false;

            if (account !== false) {
                if (response.statusCode != 200) throw new Error(`HTTP Error (${httpParams.url}) - Status [${response.statusCode}]: ${response.status}`);
                account = JSON.parse(response.data);
            }
        } catch (err) {
            console.log(err);
            engine.log(err.toString());
        } finally {
            return account;
        }
    }

    async function summonerGetCode(account, region) {
        let code = null;

        const httpParams = {
            method: "GET",
            timeout: 5 * 1000,
            url: regionize(region) + `/lol/platform/v4/third-party-code/by-summoner/${encodeURI(account.id)}?api_key=${apiKey}`
        };

        try {
            const { error, response } = await httpRequest(httpParams);

            if (error) throw new Error(`Error: ${error}`);

            if (response.statusCode == 404) code = false;
            if (response.statusCode != 200) throw new Error(`HTTP Error (${httpParams.url}) - Status [${response.statusCode}]: ${response.status}`);

            code = JSON.parse(response.data);
        } catch (err) {
            console.log(err);
            engine.log(err.toString());
        } finally {
            return code;
        }
    }

    /**
     * Functions: OTHER
     */

    function regionize(region) {
        return _apiURL.replace("%REGION%", region);
    }

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

    // SCRIPT LOADED SUCCCESFULLY
    engine.log(`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`);
});