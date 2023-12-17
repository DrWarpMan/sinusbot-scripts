registerPlugin(
	{
		/**
		 * Todo: self-cancel sent request
		 */
		name: "Move Request",
		version: "1.0.0",
		description: "Allows clients to send move (join) requests to others",
		author: "DrWarpMan <drwarpman@gmail.com>",
		backends: ["ts3"],
		engine: ">= 1.0",
		autorun: false,
		enableWeb: false,
		hidden: false,
		requiredModules: [],
		voiceCommands: [],
		vars: [
			{
				name: "logEnabled",
				type: "checkbox",
				title: "Check to enable detailed logs",
				default: false,
			},
			{
				name: "commandRequest",
				type: "string",
				title: "Command for requesting move (note: excluding prefix):",
				default: "mvrq",
				placeholder: "mvrq",
			},
			{
				name: "commandRequestAllow",
				type: "string",
				title: "Command for approving move request (note: excluding prefix):",
				default: "mvyes",
				placeholder: "mvyes",
			},
			{
				name: "commandRequestDeny",
				type: "string",
				title: "Command for denying move request (note: excluding prefix):",
				default: "mvno",
				placeholder: "mvno",
			},
			{
				name: "requestTimeout",
				type: "number",
				title: "Time to make the request expire (in seconds):",
				placeholder: "60",
				default: 60,
			},
			{
				name: "allowedGroups",
				type: "strings",
				title:
					"Group list of clients that are allowed to send move requests (empty list = everyone is allowed):",
				default: [],
			},
			{
				name: "groups_isBlacklist",
				indent: 1,
				type: "checkbox",
				title: "Use previous list of group IDs as blacklist?",
				default: false,
			},
			{
				name: "immunityGroups",
				type: "strings",
				title: "Group list of clients that no one is able to send requests to (immune group IDs):",
				default: [],
			},
			{
				name: "immunityUIDs",
				type: "strings",
				title: "UIDs list of clients that no one is able to send requests to (immune UIDs):",
				default: [],
			},
			{
				name: "showTranslation",
				type: "checkbox",
				title: "Show translation configuration",
				default: false,
			},
			{
				name: `msg_wait`,
				type: "string",
				title: `Message: "You need to wait before sending another command!"`,
				default: "You need to wait before sending another command!",
				placeholder: "You need to wait before sending another command!",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_targetNotFound`,
				type: "string",
				title: `Message: "Target was not found!"`,
				default: "Target was not found!",
				placeholder: "Target was not found!",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_targetIsBot`,
				type: "string",
				title: `Message: "You can not target the bot itself."`,
				default: "You can not target the bot itself.",
				placeholder: "You can not target the bot itself.",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_targetYourself`,
				type: "string",
				title: `Message: "You can not target yourself."`,
				default: "You can not target yourself.",
				placeholder: "You can not target yourself.",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_targetIsImmune`,
				type: "string",
				title: `Message [Placeholders: %nick%, %uid%, %clienturl%]: "Selected target can not receive move requests!"`,
				default: "Selected target can not receive move requests!",
				placeholder: "Selected target can not receive move requests!",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_targetSameChannel`,
				type: "string",
				title: `Message [Placeholders: %nick%, %uid%, %clienturl%]: "Target is already in the same channel as you are!"`,
				default: "Target is already in the same channel as you are!",
				placeholder: "Target is already in the same channel as you are!",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_requestAlreadySent`,
				type: "string",
				title: `Message: "You already have an outgoing request!"`,
				default: "You already have an outgoing request!",
				placeholder: "You already have an outgoing request!",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_targetHasPendingRequest`,
				type: "string",
				title: `Message [Placeholders: %nick%, %uid%, %clienturl%]: "Please wait, target has already got a pending move request!"`,
				default: "Please wait, target has already got a pending move request!",
				placeholder: "Please wait, target has already got a pending move request!",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_requestSentToTarget`,
				type: "string",
				title: `Message [Placeholders: %nick%, %uid%, %clienturl%]: "Request has been successfully sent to %clienturl%"`,
				default: "Request has been successfully sent to %clienturl%",
				placeholder: "Request has been successfully sent to %clienturl%",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_requestReceivedFromSender`,
				type: "string",
				title: `Message [Placeholders: %nick%, %uid%, %clienturl%]: "You have received a move request from %clienturl%"`,
				default: "You have received a move request from %clienturl%",
				placeholder: "You have received a move request from %clienturl%",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_requestExpired`,
				type: "string",
				title: `Message: "Move request has expired!"`,
				default: "Move request has expired!",
				placeholder: "Move request has expired!",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_noRequestToRespondTo`,
				type: "string",
				title: `Message: "No request to respond to!"`,
				default: "No request to respond to!",
				placeholder: "No request to respond to!",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_requestAcceptAlreadyInChannel`,
				type: "string",
				title: `Message [Placeholders: %nick%, %uid%, %clienturl%]: "Request accepted, but the client is already in your channel."`,
				default: "Request accepted, but the client is already in your channel.",
				placeholder: "Request accepted, but the client is already in your channel.",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_senderNotFoundAnymore`,
				type: "string",
				title: `Message: "The request sender could not be found, request cleared."`,
				default: "The request sender could not be found, request cleared.",
				placeholder: "The request sender could not be found, request cleared.",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_requestAccepted`,
				type: "string",
				title: `Message: "You have accepted a move request."`,
				default: "You have accepted a move request.",
				placeholder: "You have accepted a move request.",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_yourRequestAccepted`,
				type: "string",
				title: `Message: "Your request has been accepted!"`,
				default: "Your request has been accepted!",
				placeholder: "Your request has been accepted!",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_requestDenied`,
				type: "string",
				title: `Message: "You have denied a move request."`,
				default: "You have denied a move request.",
				placeholder: "You have denied a move request.",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_yourRequestDenied`,
				type: "string",
				title: `Message: "Your request has been denied!"`,
				default: "Your request has been denied!",
				placeholder: "Your request has been denied!",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_cmd_request_help`,
				type: "string",
				title: `Request Command Help: "Sends a move request to specified client"`,
				default: "Sends a move request to specified client",
				placeholder: "Sends a move request to specified client",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_cmd_request_manual`,
				type: "string",
				title: `Request Command Manual: "specify the target client by nickname, drag and drop client url or lastly uid"`,
				default: "specify the target client by nickname, drag and drop client url or lastly uid",
				placeholder:
					"specify the target client by nickname, drag and drop client url or lastly uid",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_cmd_responseYes_help`,
				type: "string",
				title: `Response Accept Command Help: "accepts a move request"`,
				default: "accepts a move request",
				placeholder: "accepts a move request",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
			{
				name: `msg_cmd_responseNo_help`,
				type: "string",
				title: `Response Deny Command Help: "denies a move request"`,
				default: "denies a move request",
				placeholder: "denies a move request",
				indent: 3,
				conditions: [{ field: "showTranslation", value: 1 }],
			},
		],
	},
	(_, config, { name, version, author }) => {
		const engine = require("engine");
		const event = require("event");
		const backend = require("backend");

		const log = msg => !!config.logEnabled && engine.log(msg);

		event.on("load", () => {
			/**
			 * Load libraries
			 */

			const command = require("command");
			if (!command) throw new Error("command.js library not found!");

			const {
				commandRequest,
				commandRequestAllow,
				commandRequestDeny,
				allowedGroups,
				groups_isBlacklist,
				immunityGroups,
				immunityUIDs,
			} = config;

			const requestTimeout = parseInt(config.requestTimeout) * 1000;

			const REQUESTS = {};

			// Banked up to 3 commands, restore 1 command usage per 5 seconds
			const requestThrottle = command
				.createThrottle()
				.tickRate(5000)
				.restorePerTick(5000)
				.penaltyPerCommand(5000)
				.initialPoints(15000);

			command
				.createCommand(commandRequest)
				.help(config.msg_cmd_request_help)
				.manual(config.msg_cmd_request_manual)
				.addArgument(args =>
					args.or
						.setName("target")
						.addArgument(args => args.client.setName("uid"))
						.addArgument(args => args.string.setName("nickname").min(1).max(30))
				)
				.checkPermission(client => hasPermission(client))
				.exec((client, { target }, reply) => {
					if (requestThrottle.isThrottled(client)) return reply(config.msg_wait);
					else requestThrottle.throttle(client);

					const targetClient = target.uid
						? backend.getClientByUID(target.uid)
						: backend.getClientByName(target.nickname);

					if (!targetClient) return reply(config.msg_targetNotFound);
					if (targetClient.isSelf()) return reply(config.msg_targetIsBot);
					if (targetClient.equals(client) || targetClient.uid() === client.uid())
						return reply(config.msg_targetYourself);
					if (isImmune(targetClient))
						return reply(replaceClientID(config.msg_targetIsImmune, targetClient));
					if (client.getChannels()[0].id() === targetClient.getChannels()[0].id())
						return reply(replaceClientID(config.msg_targetSameChannel, targetClient));

					sendMoveRequest(client, targetClient);
				});

			command
				.createCommand(commandRequestAllow)
				.help(config.msg_cmd_responseYes_help)
				.exec(client => {
					respondToMoveRequest(client, true);
				});

			command
				.createCommand(commandRequestDeny)
				.help(config.msg_cmd_responseNo_help)
				.exec(client => {
					respondToMoveRequest(client, false);
				});

			// Special change for Tutulowsky
			/**event.on("chat", ({ client, text }) => {
				if (client.isSelf()) return;

				text = text.toLowerCase();

				if (text.startsWith(commandRequestAllow)) respondToMoveRequest(client, true);
				if (text.startsWith(commandRequestDeny)) respondToMoveRequest(client, false);
			});*/

			/**
			 *
			 * Permission functions
			 *
			 */

			function hasPermission(client) {
				if (!allowedGroups || allowedGroups.length === 0) return true;

				const clientGroups = client.getServerGroups().map(g => g.id());

				return groups_isBlacklist
					? clientGroups.every(gID => !allowedGroups.includes(gID)) // blacklist
					: clientGroups.some(gID => allowedGroups.includes(gID)); // whitelist
			}

			function isImmune(client) {
				const clientGroups = client.getServerGroups().map(g => g.id());
				return (
					clientGroups.some(gID => (immunityGroups || []).includes(gID)) ||
					(immunityUIDs || []).includes(client.uid())
				);
			}

			/**
			 *
			 * Request functions
			 *
			 */

			function sendMoveRequest(sender, receiver) {
				const senderUID = sender.uid();
				const receiverUID = receiver.uid();

				log(`Preparing move request between S: ${sender.nick()} and R: ${receiver.nick()}`);

				if (senderHasOpenRequest(senderUID)) {
					log("Sender is NOT free, stopped.");
					return sender.chat(config.msg_requestAlreadySent);
				}

				if (receiverGetOpenRequest(receiverUID)) {
					log("Receiver is NOT free, stopped.");
					return sender.chat(replaceClientID(config.msg_targetHasPendingRequest, receiver));
				}

				createMoveRequest(senderUID, receiverUID);
				sender.chat(replaceClientID(config.msg_requestSentToTarget, receiver));
				receiver.chat(replaceClientID(config.msg_requestReceivedFromSender, sender));
			}

			function createMoveRequest(senderUID, receiverUID) {
				REQUESTS[receiverUID] = {
					senderUID,
					timeout: setTimeout(() => {
						clearMoveRequest(senderUID, receiverUID);
						const sender = backend.getClientByUID(senderUID);
						if (sender) sender.chat(config.msg_requestExpired);
					}, requestTimeout),
				};

				log("Move request created successfully!");
			}

			function respondToMoveRequest(receiver, response /* true = yes, false = no */) {
				const receiverUID = receiver.uid();
				const senderData = receiverGetOpenRequest(receiverUID);
				if (!senderData) return receiver.chat(config.msg_noRequestToRespondTo);

				const sender = backend.getClientByUID(senderData.senderUID);

				if (sender) {
					if (response) {
						if (receiver.getChannels()[0].id() === sender.getChannels()[0].id()) {
							receiver.chat(replaceClientID(config.msg_requestAcceptAlreadyInChannel, sender));
							log(`S: ${sender.nick()} is already in the channel as R: ${receiver.nick()}`);
						} else {
							sender.moveTo(receiver.getChannels()[0]);
							receiver.chat(config.msg_requestAccepted);
							sender.chat(config.msg_yourRequestAccepted);
							log(`S: ${sender.nick()} has been moved to R: ${receiver.nick()}`);
						}
					} else {
						receiver.chat(config.msg_requestDenied);
						sender.chat(config.msg_yourRequestDenied);
						log(`S: ${sender.nick()}'s request was declined by R: ${receiver.nick()}`);
					}
				} else {
					receiver.chat(config.msg_senderNotFoundAnymore);
					log(`S: ${sender.nick()} could not be found, request cleared by R: ${receiver.nick()}`);
				}

				clearMoveRequest(senderData.senderUID, receiverUID);
			}

			function clearMoveRequest(senderUID, forcedReceiverUID = null) {
				const receiverUID =
					forcedReceiverUID === null
						? Object.keys(REQUESTS).find(
								receiverUID => REQUESTS[receiverUID].senderUID === senderUID
						  )
						: forcedReceiverUID;

				if (!receiverUID) return;

				clearTimeout(REQUESTS[receiverUID].timeout);
				delete REQUESTS[receiverUID];
			}

			// this function also returns receiverUID if match found
			function senderHasOpenRequest(senderUID) {
				return Object.keys(REQUESTS).find(
					receiverUID => REQUESTS[receiverUID].senderUID === senderUID
				);
			}

			function receiverGetOpenRequest(receiverUID) {
				return Object.keys(REQUESTS).some(uid => uid === receiverUID)
					? REQUESTS[receiverUID]
					: null;
			}

			/**
			 *
			 * Events
			 *
			 */

			event.on("clientInvisible", ({ client }) => {
				const clientUID = client.uid();
				const receiverUID = senderHasOpenRequest(clientUID);
				if (receiverUID) {
					clearMoveRequest(clientUID, receiverUID);
					log(`${client.nick()} disconnected, move request canceled.`);
				}
			});

			/**
			 *
			 * Other
			 *
			 */

			function getClientURL(client) {
				return `[url=client://0/${client.uid()}]${client.nick()}[/url]`;
			}

			function replaceClientID(str, client) {
				return str
					.replace("%nick%", client.nick())
					.replace("%uid%", client.uid())
					.replace("%clienturl%", getClientURL(client));
			}
		});

		engine.log(`\n[LOADED] Script: "${name}" Version: "${version}" Author: "${author}"`);
	}
);
