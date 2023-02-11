registerPlugin(
	{
		name: "Fortnite Shop [fortniteapi.io]",
		version: "4.0.0",
		description: "Displays current Fortnite shop & upcoming items in channel description",
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
				name: "logLevel",
				type: "select",
				title: "Log Level:",
				options: ["ERROR", "WARN", "INFO"],
				default: "0",
			},
			{
				name: "APIKey",
				type: "password",
				title: "API key (get your own at: fortniteapi.io):",
				default: "",
				placeholder: "9a378aa6-2fdd68cf-ab45fe1f-7fdd6ecf",
			},
			{
				name: "shopChannelID",
				type: "string",
				title: "[Shop] Channel ID:",
				placeholder: "123",
				default: "",
			},
			{
				name: "shopImageSize",
				type: "select",
				title: "[Shop] Image size:",
				options: ["128x128", "256x256"],
				default: "0",
			},
			{
				name: "shopDescription",
				type: "multiline",
				title: "[Shop] Channel Description [Placeholders: %shop%]:",
				placeholder: "%shop%",
				default: "%shop%",
			},
			{
				name: "upcomingChannelID",
				type: "string",
				title: "[Upcoming Items] Channel ID:",
				placeholder: "123",
				default: "",
			},
			{
				name: "upcomingImageSize",
				type: "select",
				title: "[Upcoming Items] Image size:",
				options: ["128x128", "256x256"],
				default: "0",
			},
			{
				name: "upcomingDescription",
				type: "multiline",
				title: "[Upcoming Items] Channel Description [Placeholders: %upcoming%]:",
				placeholder: "%upcoming%",
				default: "%upcoming%",
			},
		],
	},
	(_, config, { name, version, author }) => {
		const backend = require("backend");
		const engine = require("engine");
		const event = require("event");
		const http = require("http");

		event.on("load", () => {
			// Libraries

			const logger = require("log");
			if(!logger) throw new Error("Log library not found!");
			const log = logger(engine, parseInt(config.logLevel));

			const zod = require("zod");
			if(!zod) throw new Error("Zod library not found!");
			const {z} = zod;

			const Cron = require("croner");
			if(!Cron) throw new Error("Croner library not found!");

			const {
				APIKey,
				shopChannelID,
				shopImageSize, 
				shopDescription, 
				upcomingChannelID,
				upcomingImageSize,
				upcomingDescription 
			} = config;

			/* DO NOT MODIFY AT ANY COSTS */
			const CHANNEL_DESC_SAFE_LIMIT = 7000;
			const CHANNEL_DESC_CONFIG_LIMIT = 1000;
	
			const SIZES = {
				0: 128,
				1: 256,
			};
	
			const ENDPOINTS = {
				shop: {
					channelID: shopChannelID || null,
					size: SIZES[shopImageSize] || SIZES[0],
					channelDescription: shopDescription,
					url: "https://fortniteapi.io/v2/shop",
				},
				upcoming: {
					channelID: upcomingChannelID || null,
					size: SIZES[upcomingImageSize] || SIZES[0],
					channelDescription: upcomingDescription,
					url: "https://fortniteapi.io/v2/items/upcoming",
				}
			};

			const JSON_SCHEMA = z.object({
				result: z.boolean(),
				/*lastUpdate: z.object({
					date: z.string().min(1),
					uid: z.string().min(1),
				}),*/
				shop: z.array(z.object({
					displayAssets: z.array(z.object({
						url: z.string().min(1),
						background: z.string().min(1),
						full_background: z.string().min(1)
					})).min(1),
				})).min(1).optional(),
				items: z.array(z.object({
					images: z.object({
						background: z.string().min(1),
						full_background: z.string().min(1)
					})
				})).min(1).optional()
			}).transform(({result, shop, items}) => {
				return {
					result,
					images: shop
						? shop.map(({displayAssets}) => {
							const {url, background, full_background} = displayAssets[0];
							return full_background || background || url;
						})
						: items.map(({images}) => {
							const {background, full_background} = images;
							return full_background || background;
						}),
				};
			});

			async function updateChannels() {
				if(!backend.isConnected())
				{
					log("INFO", "Backend not connected, skipping update.");
					return;
				} else {
					log("INFO", "Updating channels.");
				}

				for(const endpointName in ENDPOINTS) {
					try {
						const { channelID, size, channelDescription, url } = ENDPOINTS[endpointName];
						
						if(channelID === null) {
							log("INFO", `Endpoint "${endpointName}" not configured, ignoring endpoint.`);
							continue;
						}

						log("INFO", `Updating endpoint: "${endpointName}"`);
						
						const channel = backend.getChannelByID(channelID);

						if(!channel) {
							log("ERROR", `Channel with ID ${channelID} not found, skipping endpoint.`);
							continue;
						}

						if(channelDescription.length > CHANNEL_DESC_CONFIG_LIMIT)
						{
							log("ERROR", `Configured channel description exceeds the limit (${CHANNEL_DESC_CONFIG_LIMIT}), skipping endpoint.`);
							continue;
						}

						log("INFO", "Requesting data.");
						let images = await fetchItems(url);
						
						if(images === false) {
							log("ERROR", "Data request failed, skipping endpoint.");
							continue;
						}

						log("INFO", "Adding BB code + image size parameter.");
						images = images.map(imageURL => `[img]${imageURL}?width=${size}[/img]`);
						

						log("INFO", "Splitting up images into multiple channels (if needed)");

						const descriptions = [];

						let currentLength = channelDescription.length;
						let lastCutPosition = 0;

						for(let i = 0; i < images.length; i++) {
							const image = images[i];

							currentLength += image.length;

							if(currentLength > CHANNEL_DESC_SAFE_LIMIT)
							{
								// reset
								currentLength = channelDescription.length;

								// add new description
								descriptions.push(
									channelDescription.replace(
										`%${endpointName}%`, images.slice(lastCutPosition, i+1).join("")
									)
								);

								// set new cut-off position
								lastCutPosition = i+1;
							}
						}

						// leftovers
						if(lastCutPosition < images.length) {
							descriptions.push(
								channelDescription.replace(
									`%${endpointName}%`, images.slice(lastCutPosition).join("")
								)
							);
						}
						
						if(descriptions.length <= 0 || descriptions.length > 30 /* there should never be this amount of channels */) {
							log("ERROR", "Something went horribly wrong when splitting up images into multiple channels, skipping endpoint.");
							continue;
						}

						log("INFO", `Total channels needed: ${descriptions.length}`);
						
						log("INFO", "Setting description of first (parent/main) channel.");
						channel.setDescription(descriptions.splice(0, 1)[0]);
						
						if(descriptions.length > 0) {
							log("INFO", "Deleting previous subchannels.");
							backend.getChannels()
								.filter(ch => ch.parent() && ch.parent().id() === channel.id())
								.forEach(ch => ch.delete());						
							
							log("INFO", "Creating subchannels with description.");
							
							const params = {
								parent: channel.id(),
								permanent: true,
							};

							for(let i = 0; i < descriptions.length; i++) {
								//@ts-ignore
								backend.createChannel({...params, 
									description: descriptions[i],
									name: `Page ${i+1}`,
								});
							}	
						}
						log("INFO", `Endpoint ${endpointName} finished.`);
					} catch(err) {
						console.log(err);
						log("ERROR", "Unexpected error ocurred, skipping endpoint.");
					}
				}
			}

			async function fetchItems(url) {
				try {
					const { statusCode, status, data: body } = await httpRequest({
						method: "GET",
						url,
						timeout: 5000,
						headers: { Authorization: APIKey } 
					});
	
					if(statusCode !== 200) {
						throw new Error(`HTTP error - ${statusCode}: ${status}`);
					}
	
					const data = JSON.parse(body.toString());

					const {result, images} = JSON_SCHEMA.parse(data);
	
					if(result !== true) {
						throw new Error("API says result is falsy.");
					}
	
					return images;
				} catch (err) {
					console.log(err);
					log("ERROR", `Something went wrong while fetching URL: ${url}`);
					return false;
				}
			}

			function httpRequest(config) {
				return new Promise((resolve, reject) => {
					try {
						http.simpleRequest(config, (err, res) => {
							if (err) {
								return reject(new Error(err));
							}
	
							return resolve(res);
						});
					} catch (err) {
						return reject(err);
					}
				});
			}

			log("INFO", "Setting up automatic update..");
			// Run at midnight + 1 minute delay (at this time, shop should change)
			new Cron("1 0 * * *", { timezone: "UTC" }, updateChannels);
			// Run every 6th hours
			new Cron("0 */6 * * *", { timezone: "UTC" }, updateChannels);
			// Run as soon as backend is connected, check every 10th second
			new Cron("*/10 * * * * *", function() {
				if(backend.isConnected()) {
					updateChannels();
					this.stop();	
				}
			});
			
			engine.log(`Loaded: ${name} | v${version} | ${author}`);
		});
	}
);
