registerPlugin(
	{
		name: "Fornite Shop [fortniteapi.io]",
		version: "2.0.0",
		description: "Display current Fortnite shop rotation & more in a channel description",
		author: "DrWarpMan <drwarpman@gmail.com>",
		backends: ["ts3"],
		engine: ">= 1.0",
		autorun: false,
		enableWeb: false,
		hidden: false,
		requiredModules: ["http"],
		voiceCommands: [],
		vars: [
			{
				name: "logEnabled",
				type: "checkbox",
				title: "Check to enable detailed logs",
				default: false,
			},
			{
				name: "key",
				type: "password",
				title: "API key (get your own at fortniteapi.io):",
				default: "",
				placeholder: "9a378aa6-2fdd68cf-ab45fe1f-7fdd6ecf",
			},
			{
				name: "channelID_shop",
				type: "string",
				title: "[Shop] Channel ID:",
				placeholder: "69",
				default: "",
			},
			{
				name: "size_shop",
				type: "select",
				title: "[Shop] Image size:",
				options: ["128x128", "256x256"],
				default: "0",
			},
			{
				name: "description_shop",
				type: "multiline",
				title: "[Shop] Channel Description [Placeholders: %shop%]:",
				placeholder: "%shop%",
				default: "%shop%",
			},
			{
				name: "channelID_upcoming",
				type: "string",
				title: "[Upcoming items] Channel ID:",
				placeholder: "69",
				default: "",
			},
			{
				name: "size_upcoming",
				type: "select",
				title: "[Upcoming items] Image size:",
				options: ["128x128", "256x256"],
				default: "0",
			},
			{
				name: "description_upcoming",
				type: "multiline",
				title: "[Upcoming items] Channel Description [Placeholders: %upcoming%]:",
				placeholder: "%upcoming%",
				default: "%upcoming%",
			},
		],
	},
	(_, config, { name, version, author }) => {
		const engine = require("engine");
		const backend = require("backend");
		const http = require("http");

		const log = msg => !!config.logEnabled && engine.log(msg);

		// Variables

		const { key } = config;

		const SIZES = {
			0: 128,
			1: 256,
		};

		const SHOP = {
			size: Object.keys(SIZES).includes(config.size_shop) ? SIZES[config.size_shop] : SIZES[0],

			channelID: config.channelID_shop || 0,
			channelDescription: config.description_shop || "%shop%",
		};

		const UPCOMING = {
			size: Object.keys(SIZES).includes(config.size_upcoming)
				? SIZES[config.size_upcoming]
				: SIZES[0],

			channelID: config.channelID_upcoming || 0,
			channelDescription: config.description_upcoming || "%upcoming%",
		};

		if (!SHOP.channelID && !UPCOMING.channelID)
			return log("Channel IDs are empty, no reason to continue working.. script exiting!");

		const URL_SHOP = "https://fortniteapi.io/v2/shop?lang=en";
		const URL_UPCOMING = "https://fortniteapi.io/v2/items/upcoming?lang=en";

		setTimeout(fetchData, 15 * 1000);
		setInterval(fetchData, 180 * 1000);

		async function fetchData() {
			if (!backend.isConnected())
				return log("Backend is not connected, can not update Fortnite shop.");

			const shop = SHOP.channelID ? (await fetchItems("shop", URL_SHOP)).shop : null;
			const upcoming = UPCOMING.channelID
				? (await fetchItems("upcoming", URL_UPCOMING)).items
				: null;

			if (shop === false || upcoming === false)
				return log("Something went wrong, fetch data ended.");

			const itemsImagesIntoArray = (data, imageSize, type) => {
				return data.reduce((allItems, currentItem) => {
					let image = null;
					let images = null;

					if (type === "shop") {
						if (Array.isArray(currentItem.displayAssets) && currentItem.displayAssets.length >= 1)
							images = currentItem.displayAssets[0];
					} else if (type === "upcoming") {
						if (currentItem.images && Object.keys(currentItem.images).length >= 1)
							images = currentItem.images;
					}

					if (images) {
						if (images.full_background) image = images.full_background;
						else if (images.background) image = images.background;
						else if (images.url) image = images.url;

						if (image) {
							image += "?width=" + imageSize;
							allItems.push(image);
						}
					}

					return allItems;
				}, []);
			};

			const updateChannel = (channelID, channelDescription, imageSize, data, placeholder, type) => {
				try {
					const items = itemsImagesIntoArray(data, imageSize, type);

					/* Prepare channel description */

					let text = "";

					for (const itemImg of items) text += `[img]${itemImg}[/img]`;

					/* Update channel description */

					const channel = backend.getChannelByID(channelID);

					if (channel) {
						channel.setDescription(channelDescription.replace(placeholder, text));
					} else {
						log(`Channel with ID: ${channelID} not found.`);
					}
				} catch (err) {
					console.log(err);
					return false;
				}
				return true;
			};

			if (
				SHOP.channelID &&
				updateChannel(SHOP.channelID, SHOP.channelDescription, SHOP.size, shop, "%shop%", "shop")
			) {
				log("Shop items in channel updated successfully!");
			} else {
				if (SHOP.channelID) log("Something went wrong when updating channel with shop items!");
			}

			if (
				UPCOMING.channelID &&
				updateChannel(
					UPCOMING.channelID,
					UPCOMING.channelDescription,
					UPCOMING.size,
					upcoming,
					"%upcoming%",
					"upcoming"
				)
			) {
				log("Upcoming items in channel updated successfully!");
			} else {
				if (UPCOMING.channelID)
					log("Something went wrong when updating channel with Upcoming items!");
			}
		}

		async function fetchItems(type, url) {
			log("Fetching " + type + " items..");

			let response = null;

			try {
				response = await httpRequest({ url, headers: { Authorization: key } });

				if (!response)
					throw new Error(
						"Something went wrong with the Fortnite items (" + type + ") HTTP request."
					);

				if (response.statusCode !== 200)
					throw new Error(`HTTP Error (${response.statusCode}): ${response.status}`);

				response.data = JSON.parse(response.data.toString());

				const { result } = response.data;

				if (result !== true)
					throw new Error("API responded with false result, something went wrong.");

				log("Fetch request of Fortnite items (" + type + ") response is 200 (OK), successful.");
			} catch (err) {
				console.log(err);
				return false;
			}

			return response.data;
		}

		function httpRequest({ method = "GET", url = "", timeout = 5000, body = "", headers = {} }) {
			return new Promise((resolve, reject) => {
				http.simpleRequest({ method, url, timeout, body, headers }, (error, response) => {
					if (error) reject(error);
					else resolve(response);
				});
			});
		}

		engine.log(`\n[LOADED] Script: "${name}" Version: "${version}" Author: "${author}"`);
	}
);
