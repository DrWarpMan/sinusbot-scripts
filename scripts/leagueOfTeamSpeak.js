const ranks = {
    CHALLENGERI: 27,
    GRANDMASTERI: 26,
    MASTERI: 25,
    DIAMONDI: 24,
    DIAMONDII: 23,
    DIAMONDIII: 22,
    DIAMONDIV: 21,
    PLATINUMI: 20,
    PLATINUMII: 19,
    PLATINUMIII: 18,
    PLATINUMIV: 17,
    GOLDI: 16,
    GOLDII: 15,
    GOLDIII: 14,
    GOLDIV: 13,
    SILVERI: 12,
    SILVERII: 11,
    SILVERIII: 10,
    SILVERIV: 9,
    BRONZEI: 8,
    BRONZEII: 7,
    BRONZEIII: 6,
    BRONZEIV: 5,
    IRONI: 4,
    IRONII: 3,
    IRONIII: 2,
    IRONIV: 1,
    UNRANKED: 0
};

function loadRankVars() {
    return Object.keys(ranks).map(rank => ({
        name: "rank_" + rank,
        type: "number",
        title: rank,
        placeholder: "69",
        indent: 3,
        conditions: [{ field: 'ranksGroups', value: 1 }]
    }));
}

const rankVars = loadRankVars();

registerPlugin({
    name: "League of TeamSpeak",
    version: "1.0.0",
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
        }, {
            name: "rankShowMethod",
            type: "select",
            title: "What rank to show?",
            options: ["HIGHEST", "SOLO", "FLEX"],
            default: 0
        }, {
            name: "ranksGroups",
            title: "Show ranks and groups settings:",
            type: "checkbox",
            default: false
        }, ...rankVars,
        /* HIDDEN VARIABLES - DO NOT TOUCH */
        {
            name: "ranksObj",
            title: "",
            default: ranks
        }
    ]
}, (_, config, { name, version, author }) => {

    /* INTERFACES */

    const backend = require("backend");
    const engine = require("engine");
    const http = require("http");
    const event = require("event");
    const store = require("store");

    /* CONFIG VARS */

    const { apiKey, rankShowMethod } = config;

    // Hidden config variables
    const { ranksObj: ranks } = config;

    /* CONST VARS */

    const apiURL = "https://%REGION%.api.riotgames.com";
    const rankMethods = {
        "0": "HIGHEST",
        "1": "SOLO",
        "2": "FLEX"
    }

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

    const cmdAccountAdd = "!add";
    const cmdAccountVerify = "!ver";
    const cmdAccountRemove = "!rem";

    // DEF VARS
    const SOLO_TYPE = "RANKED_SOLO_5x5";
    const FLEX_TYPE = "RANKED_FLEX_SR";

    const CFG_PREFIX_RANK = "rank_";

    const REGIONS = {
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

    const VERIFY_TIMER = {};

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
            case cmdAccountAdd:
                cmdFuncs.accountAdd(client, args);
                break;
            case cmdAccountVerify:
                cmdFuncs.accountVerify(client);
                break;
            case cmdAccountRemove:
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
            const region = REGIONS[(_region !== "ALL") ? _region : args[args.length - 1].toUpperCase()];

            if (!summonerName || (summonerName && summonerName.length <= 1)) return client.chat(_msgSummonerNameBad);
            if (!region) return client.chat(_msgRegionInvalid);

            // Start adding proccess

            try {
                const account = await summonerByName(summonerName, region);

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

                    accountMakeVerified(client);
                    verifyRemoveTimer(client);
                    accountRemoveDuplicates(account, region);
                    accountUpdate(client);

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
     * Functions: CLIENT MANAGEMENT
     */

    function clientHasGroup(client, groupID) {
        groupID += ""; // convert to string
        return client.getServerGroups().map(g => g.id()).includes(groupID);
    }

    function clientHasGroups(client, groupIDs) {
        return client.getServerGroups().map(g => g.id()).some(gID => groupIDs.includes(gID));
    }

    /**
     * Functions: ACCOUNT MANAGEMENT
     */

    function accountSet(client, account, region, verified = false) {
        store.set(client.uid(), {
            "account": account,
            "region": region,
            "verified": verified
        });
    }

    function accountGet(client) {
        return store.get(client.uid());
    }

    async function accountUpdate(client) {
        const { account, region, verified } = accountGet(client);

        if (!verified) return;

        accountRankUpdate(client, account, region);
        accountMasteryUpdate();
    }

    async function accountRankUpdate(client, account, region) {
        const rankData = await summonerRanks(account, region);

        // Probably error ocurred in http request
        if (rankData === null) return;

        const soloData = Object.values(rankData).find(({ queueType }) => queueType === SOLO_TYPE);
        const flexData = Object.values(rankData).find(({ queueType }) => queueType === FLEX_TYPE);

        const { tier: soloTier, rank: soloRank } = (!soloData) ? {} : soloData;
        const { tier: flexTier, rank: flexRank } = (!flexData) ? {} : flexData;

        const soloFull = (!soloData) ? "UNRANKED" : `${soloTier}${soloRank}`;
        const flexFull = (!flexData) ? "UNRANKED" : `${flexTier}${flexRank}`;

        let finalRank;

        switch (rankMethods[rankShowMethod]) {
            case "SOLO":
                finalRank = soloFull;
                break;
            case "FLEX":
                finalRank = flexFull;
                break;
            default: // HIGHEST
                const soloWeight = ranks[soloFull];
                const flexWeight = ranks[flexFull];

                finalRank = soloWeight < flexWeight ? flexFull : soloFull;
        }

        const groupID = config[CFG_PREFIX_RANK + finalRank];

        // Add his rank

        if (!groupID) return engine.log(`ERROR: Group for rank: ${finalRank} was not found!`);

        if (!clientHasGroup(client, groupID)) client.addToServerGroup(groupID);

        // Remove other ranks

        const otherRanks = Object.keys(ranks).filter(rank => rank !== finalRank);

        otherRanks.forEach(rank => {
            const groupID = config[CFG_PREFIX_RANK + rank];
            if (!groupID) engine.log(`Group for rank: ${rank} was not found!`);
            if (clientHasGroup(client, groupID)) client.removeFromServerGroup(groupID);
        });
    }

    function accountMasteryUpdate(client, account, region) {

    }

    function accountRemove(client) {
        return !!store.unset(client.uid());
    }

    function accountRemoveDuplicates(targetAccount, targetRegion) {
        store.getKeys().forEach((uid) => {
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

    function accountMakeVerified(client) {
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

        return VERIFY_TIMER[client.uid()] = {
            "expiryDate": ate.now() + _verifyTime * 1000,
            "verifyCode": code
        }
    }

    function verifyGetTimer(client) {
        return VERIFY_TIMER[client.uid()] || {
            expiryDate: 0,
            verifyCode: false
        };
    }

    function verifyRemoveTimer(client) {
        delete VERIFY_TIMER[client.uid()];
    }

    function verifyRandCode() {
        return Math.random().toString(20).substr(2, 6);
    }

    /**
     * Functions: SUMMONER
     */
    async function summonerByName(summonerName, region) {
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

    async function summonerRanks(account, region) {
        let rankData = null;

        const httpParams = {
            method: "GET",
            timeout: 5 * 1000,
            url: regionize(region) + `/lol/league/v4/entries/by-summoner/${account.id}?api_key=${apiKey}`
        };

        try {
            const { error, response } = await httpRequest(httpParams);

            if (error) throw new Error(`Error: ${error}`);
            if (response.statusCode != 200) throw new Error(`HTTP Error (${httpParams.url}) - Status [${response.statusCode}]: ${response.status}`);

            rankData = JSON.parse(response.data);
        } catch (err) {
            console.log(err);
            engine.log(err.toString());
        } finally {
            return rankData;
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

            if (code !== false) {
                if (response.statusCode != 200) throw new Error(`HTTP Error (${httpParams.url}) - Status [${response.statusCode}]: ${response.status}`);
                code = JSON.parse(response.data);
            }
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

    function loadRanks() {
        const ranks = {};
        const ranksNames = (Object.keys(config).filter(varName => varName.startsWith(CFG_PREFIX_RANK))).reverse();
        ranksNames.forEach((rankName, index) => ranks[rankName] = index);
        return ranks;
    }

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