registerPlugin({ // AUTO REFRESH
    name: "Fortnite Shop [fortniteapi.io]",
    version: "1.0.0",
    description: "Fortnite Shop in TeamSpeak channel!",
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
        title: "Update interval (minutes):",
        default: 5,
        placeholder: "5"
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
            name: "imgSize",
            type: "number",
            title: "Size of images (x * x) [Default: 64]:",
            placeholder: "64"
        }, {
            name: "imgFull",
            type: "checkbox",
            title: "Use full background => with name and price?"
        }, {
            name: "columns",
            type: "number",
            title: "Number of columns (images per line) (use 0 for auto) [Default: 3]:",
            placeholder: "3"
        }, {
            name: "description",
            type: "multiline",
            title: "Description [Placeholders: %daily%, %featured%, %upcoming%]:"
        }]
    }]
}, (_, config, { name, version, author }) => {

    const engine = require("engine");
    const backend = require("backend");
    const event = require("event");
    const http = require("http");

    const { apiKey, interval, channels, logEnabled } = config;

    event.on("connect", updateData);
    setInterval(updateData, (interval || 5) * 60 * 1000);

    async function updateData() {
        if (!backend.isConnected()) return;
        if ((channels || []).length <= 0) return logMsg("No channels configured!");

        const { daily: dailyItems, featured: featuredItems } = await getShopItems();
        const upcomingItems = await getUpcomingItems();

        if ([dailyItems, featuredItems, upcomingItems].some(items => !items))
            return logMsg("Error while receiving items..");

        channels.forEach(channelData => {
            const { id, imgSize, imgFull, columns } = channelData;
            let { description } = channelData;

            const channel = backend.getChannelByID(id);

            if (channel) {
                if (description) {
                    const imgType = (imgFull) ? "full" : "noinfo";

                    description = description
                        .replace("%daily%", itemsDesc(dailyItems, columns, imgSize, imgType))
                        .replace("%featured%", itemsDesc(featuredItems, columns, imgSize, imgType))
                        .replace("%upcoming%", itemsDesc(upcomingItems, columns, imgSize, imgType));

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

            shop = JSON.parse(response.data);

            daily = formatItems([...shop.specialDaily, ...shop.daily]);
            featured = formatItems([...shop.specialFeatured, ...shop.featured]);

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
        const regex = new RegExp(/https:\/\/media.fortniteapi.io\/images\/(.*?)\/.*$/);
        const match = (item.icon || item.images.background || item.images.featured).match(regex);

        if (match) {
            const id = match[1];
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

    function itemsDesc(items, columns, imgSize, imgType) {
        const cacheFix = (imgType === "full") ? getCacheFix() : "";
        let desc = "";

        if (columns == 0) {
            items.forEach(({ img }) => desc += `[img]${img[imgType] + "?width=" + imgSize + cacheFix}[/img]`);
        } else {
            const itemRows = arrSplitBy(items, columns);

            itemRows.forEach(itemRow => {
                desc += "[tr]";
                itemRow.forEach(({ img }) => {
                    desc += "[td]";
                    desc += `[img]${img[imgType] + "?width=" + imgSize + cacheFix}[/img]`;
                    desc += "[/td]";
                });
                desc += "[/tr]";
            });

            desc = "[table]" + desc + "[/table]";
        }

        return desc;
    }

    function getCacheFix() {
        return `&${Math.floor(Date.now()/1000)}`;
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