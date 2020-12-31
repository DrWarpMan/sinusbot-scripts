registerPlugin({
    name: "Fortnite Shop [fortniteapi.io]",
    version: "1.0.0",
    description: "Show Fortnite Shop & more in a channel description",
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
        name: "apiKey",
        type: "password",
        title: "API key (get your own at fortniteapi.io):",
        default: ""
    }, {
        name: "interval",
        type: "number",
        title: "Update interval (minutes) [Set to 0 if you aren't using upcoming items]:",
        default: 60,
        placeholder: "60"
    }, {
        name: "channels",
        type: "array",
        title: "Channels:",
        default: [],
        vars: [{
            name: "id",
            type: "string",
            title: "ID:"
        }, {
            name: "description",
            type: "multiline",
            title: "Description [Placeholders: %ITEMTYPE-IMGSIZE-IMGTYPE-COLUMNS%] (documented on the forums):"
        }]
    }]
}, (_, config, { name, version, author }) => {

    const engine = require("engine");
    const backend = require("backend");
    const event = require("event");
    const http = require("http");

    const { apiKey, interval, channels, logEnabled } = config;

    // Update on connection
    if (backend.isConnected()) updateData();
    event.on("connect", updateData);
    // Schedule next update
    updateSchedule();
    // Auto update if needed
    if (interval) setInterval(updateData, interval * 60 * 1000);

    async function updateData() {
        if (!backend.isConnected()) return;
        if ((channels || []).length <= 0) return logMsg("No channels configured!");

        const { daily: dailyItems, featured: featuredItems } = await getShopItems();
        const upcomingItems = await getUpcomingItems();

        if ([dailyItems, featuredItems, upcomingItems].some(items => !items))
            return logMsg("Error while receiving items..");

        channels.forEach(channelData => {
            const { id } = channelData;
            let { description } = channelData;

            const channel = backend.getChannelByID(id);

            if (channel) {
                if (description && description.length > 0) {
                    const regexp = new RegExp(/%(?<itemType>daily|featured|upcoming)-(?<size>\d+)-(?<imgType>full|noinfo)-(?<columns>\d)%/, "gi");
                    const matches = [ /*...description.matchAll(regexp) ---> ES6 :( */ ];

                    let m;
                    while (m = regexp.exec(description))
                        matches.push(m);

                    matches.forEach(match => {
                        const fullMatch = match[0];
                        //const { itemType, size, imgType, columns } = match.groups; ---> ES6 :(
                        const itemType = match[1];
                        const size = match[2];
                        const imgType = match[3];
                        const columns = match[4];

                        let items = [];

                        switch (itemType) {
                            case "daily":
                                items = dailyItems;
                                break;
                            case "featured":
                                items = featuredItems;
                                break;
                            case "upcoming":
                                items = upcomingItems;
                                break;
                            default:
                                throw new Error("Invalid item type!");
                        }

                        description = description.replace(fullMatch, itemsDesc(items, size, imgType, columns));
                    });

                    if (description.length > 8192)
                        logMsg(`Channel (ID: ${id}) description is too long (${description.length})!`);

                    channel.setDescription(description);
                } else logMsg("Channel description empty!");
            } else logMsg("Error, channel not found!")
        });
    }

    async function getShopItems() {
        const httpParams = {
            method: "GET",
            timeout: 5000,
            url: "https://fortniteapi.io/shop",
            headers: {
                'Authorization': apiKey
            }
        };

        let shopItems = false;

        try {
            const { error, response } = await httpRequest(httpParams);

            if (error) throw new Error(`Error: ${error}`);
            if (response.statusCode != 200) throw new Error(`HTTP Error (${httpParams.url}) - Status [${response.statusCode}]: ${response.status}`);

            const shop = JSON.parse(response.data);

            const daily = formatItems([...shop.specialDaily, ...shop.daily]);
            const featured = formatItems([...shop.specialFeatured, ...shop.featured]);

            shopItems = {
                daily,
                featured
            };
        } catch (err) {
            console.log(err);
            engine.log(err.toString());
        } finally {
            return shopItems;
        }
    }

    async function getUpcomingItems() {
        const httpParams = {
            method: "GET",
            timeout: 5000,
            url: "https://fortniteapi.io/items/upcoming",
            headers: {
                'Authorization': apiKey
            }
        };

        let upcomingItems = false;

        try {
            const { error, response } = await httpRequest(httpParams);

            if (error) throw new Error(`Error: ${error}`);
            if (response.statusCode != 200) throw new Error(`HTTP Error (${httpParams.url}) - Status [${response.statusCode}]: ${response.status}`);

            upcomingItems = JSON.parse(response.data);
            upcomingItems = upcomingItems.items;
            upcomingItems = formatItems(upcomingItems);
        } catch (err) {
            console.log(err);
            engine.log(err.toString());
        } finally {
            return upcomingItems;
        }
    }

    async function updateSchedule() {
        const httpParams = {
            method: "GET",
            timeout: 5000,
            url: "https://fortniteapi.io/shop",
            headers: {
                'Authorization': apiKey
            }
        };

        let endingDates = false;

        try {
            const { error, response } = await httpRequest(httpParams);

            if (error) throw new Error(`Error: ${error}`);
            if (response.statusCode != 200) throw new Error(`HTTP Error (${httpParams.url}) - Status [${response.statusCode}]: ${response.status}`);

            const shop = JSON.parse(response.data);

            endingDates = shop.endingDates;
        } catch (err) {
            console.log(err);
            engine.log(err.toString());
            setTimeout(updateSchedule, 10 * 1000); // log error and try again..
            return;
        }

        if (!endingDates) return logMsg("Error, while scheduling data update!");

        const { daily, featured } = endingDates;
        const dateD = new Date(daily);
        const dateF = new Date(featured);
        const dateSchedule = ((dateD > dateF) ? dateD : dateF);
        const safeTime = 3 * 60 * 1000; // wait 3 more minutes, to be safe
        const msTillUpdate = (dateSchedule.getTime() + safeTime) - Date.now();

        logMsg("Update is scheduled in (ms): " + msTillUpdate);

        setTimeout(() => {
            logMsg("Scheduled update started!");
            updateData();
            updateSchedule();
        }, msTillUpdate);
    }

    function formatItems(items) {
        return items.map(item => ({
            "name": item.name,
            "type": item.type,
            "rarity": item.rarity,
            "price": item.price,
            "img": getImg(item)
        }));
    }

    function getImg(item) {
        const regex = new RegExp(/https:\/\/media.fortniteapi.io\/images\/(?<id>.*?)\/.*$/);
        const match = (item.icon || item.images.background || item.images.featured).match(regex);

        if (match) {
            const id = match[1]; // match.groups.id; ---> ES6 :(
            return {
                "full": `https://media.fortniteapi.io/images/${id}/background_full.en.png`,
                "noinfo": `https://media.fortniteapi.io/images/${id}/background.png`
            };
        } else throw new Error("Error while receiving image url!");
    }

    function arrSplitBy(array = [], splitNum = 0) {
        if (splitNum == 0) return array;
        return (array || []).reduce((acc, curr, index) => {
            if (index % splitNum === 0)
                acc.push([]);
            acc[acc.length - 1].push(curr);
            return acc;
        }, []);
    }

    function itemsDesc(items, imgSize, imgType, columns) {
        /* Parsing */

        imgSize = parseInt(imgSize);
        columns = parseInt(columns);
        imgType = imgType.toLowerCase();

        /* Description */

        let itemsDesc = "";

        if (columns === 0) {
            items.forEach(({ img }) => itemsDesc += "[img]" + img[imgType] + "?width=" + imgSize + "[/img]");
        } else {
            const itemRows = arrSplitBy(items, columns);

            itemRows.forEach(itemRow => {
                itemsDesc += "[tr]";

                itemRow.forEach(({ img }) => {
                    itemsDesc += "[td]";
                    itemsDesc += "[img]" + img[imgType] + "?width=" + imgSize + "[/img]";
                    itemsDesc += "[/td]";
                });

                itemsDesc += "[/tr]";
            });

            itemsDesc = "[table]" + itemsDesc + "[/table]";
        }

        return itemsDesc;
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

    function logMsg(msg) {
        return !!logEnabled && engine.log(msg);
    }

    // SCRIPT LOADED SUCCCESFULLY
    engine.log(`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`);
});