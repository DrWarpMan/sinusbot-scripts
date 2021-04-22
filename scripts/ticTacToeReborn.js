registerPlugin({
    name: "Tic Tac Toe [Reborn]",
    version: "1.0.0",
    description: "Tic Tac Toe game for TeamSpeak with ranking system",
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
    }]
}, (_, config, { name, version, author }) => {

    const engine = require("engine");
    const backend = require("backend");
    const event = require("event");

    engine.log(`\n[LOADING] Script: "${name}" Version: "${version}" Author: "${author}"`);

    const log = msg => !!config.logEnabled && engine.log(msg);

    const CMD = "!ttt";
    const FIELD_SIZE = 10;
    const MARKS_TO_WIN = 5;
    const INVITE_EXPIRE = 60 * 1000;

    const MARK = {
        empty: 0,
        p1: 1,
        p2: 2
    }

    /* TODO:
    - timeout solution for the invite?
    - cancel decline ignore?
    - disconnect solution?
    - timer for move etc.?
    */

    const INVITES = {};
    const PLAYERS = new Map();

    class TTT {
        constructor(c1, c2, size) {
            // Players
            this.players = {};
            this.uid1 = c1.uid();
            this.uid2 = c2.uid();
            this.players[this.uid1] = "p1";
            this.players[this.uid2] = "p2";

            // Game settings
            this.size = size;
            this.turn = Math.random() < 1 / 2 ? this.uid1 : this.uid2; // Random first turn
            this.field = Array.from(Array(size), () => Array(size).fill(MARK.empty)); // Create empty x*x field

            const first = backend.getClientByUID(this.turn);
            const second = backend.getClientByUID((this.uid1 === this.turn) ? this.uid2 : this.uid1);

            first.chat("It's [b]your[/b] turn!");
            second.chat("Wait for [b]" + first.nick() + "[/b] to make a move!");
        }

        place(x, y, uid) {
            if (this.turn !== uid) return "Not your turn!";
            if (typeof this.field[y] === "undefined") return "Out of bounds!";
            if (typeof this.field[y][x] === "undefined") return "Out of bounds!";

            const currentMark = this.field[y][x];
            if (currentMark !== MARK.empty) return "This position is occupied!";

            this.field[y][x] = MARK[this.players[uid]]; // Place the mark
            backend.getClientByUID(uid).chat("Mark placed!"); // Inform the client
            this.showField(); // Print the field after a move

            if (this.isWin(uid)) {
                this.makeWin(uid);
                return true;
            }

            this.turnSwitch(); // Switch player's turn after a move

            return true;
        }

        showField() {
            const players = [
                backend.getClientByUID(this.uid1),
                backend.getClientByUID(this.uid2)
            ];

            players.filter(c => c).forEach(c => {
                // IMPROVE !!!
                const field = this.field.map(row => row.join("|")).join("\n");
                c.chat("Field:\n" + field);
            });
        }

        isWin(uid) {
            const playerMark = MARK[this.players[uid]];
            const expectedResult = playerMark * MARKS_TO_WIN;

            const winByRows = () => {
                for (let i = 0; i < this.size; i++) {
                    let result = 0;
                    const row = this.field[i];
                    for (let j = 0; j < row.length; j++) {
                        const rowMark = row[j];
                        (rowMark === playerMark) ? (result += rowMark) : (result = 0);
                        if (result === expectedResult) return true;
                    }
                }

                return false;
            };

            const winByColumns = () => {
                for (let x = 0; x < this.size; x++) {
                    let result = 0;
                    for (let y = 0; y < this.size; y++) {
                        const columnMark = this.field[y][x];
                        (columnMark === playerMark) ? (result += columnMark) : (result = 0);
                        if (result === expectedResult) return true;
                    }
                }

                return false;
            }

            const winByDiagonals = () => {
                let result = 0;
                let [x, y] = [0, this.size - 1];

                const checkDiagonal = (x, y) => {
                    while (x < this.size && y < this.size) {
                        const diagonalMark = this.field[x][y];
                        (diagonalMark === playerMark) ? (result += diagonalMark) : (result = 0);
                        if (result === expectedResult) return true;
                        x++;
                        y++;
                    }
                };

                for (; y > 0; y--)
                    if (checkDiagonal(x, y)) return true;
                for (; x < this.size; x++)
                    if (checkDiagonal(x, y)) return true;

                return false;
            }

            return (winByRows() || winByColumns() || winByDiagonals());
        }

        turnSwitch() {
            this.turn = (this.uid1 === this.turn) ? this.uid2 : this.uid1; // Switch turn
            const player = backend.getClientByUID(this.turn);
            if (player) player.chat("It's your turn!"); // Notify the player
        }

        makeWin(winnerUID) {
            const winner = backend.getClientByUID(winnerUID);
            const looserUID = (this.uid1 === winnerUID) ? this.uid2 : this.uid1;
            const looser = backend.getClientByUID(looserUID);

            winner.chat("You [color=green][b]won[/b][/color]!");
            looser.chat("You [color=red][b]lost[/b][/color]!");
            this.end();
        }

        end() {
            return PLAYERS.delete(this.uid1) && PLAYERS.delete(this.uid2);
        }
    }

    event.on("chat", ({ client, text, mode }) => {
        if (client.isSelf() /*ignore self*/ || mode !== 1 /*only private chat*/ )
            return;

        const msg = text.split(" ").filter(i => /\s/.test(i) === false && i.length > 0);
        const command = msg[0];

        if (command === CMD) {
            const args = msg.slice(1);
            const subcommand = args[0];

            switch (subcommand) {
                case "invite":
                    if (inGame(client))
                        return client.chat("You are already in a game!");

                    const target = args.slice(1).join(" ");
                    if (!target || target.length < 3 /* minimum nick length */ )
                        return client.chat("Invalid target!");

                    const targetClient = backend.getClientByNick(target) || backend.getClientByUID(target);
                    if (!targetClient) return client.chat("Target not found!");
                    if (targetClient.uid() === client.uid()) return client.chat("You can not invite yourself!");
                    if (inGame(targetClient)) return client.chat("Invited target is currently in-game!");

                    invite(client, targetClient);
                    break;
                case "accept":
                    if (inGame(client)) return client.chat("You are already in a game!");

                    const inviterNick = args.slice(1).join(" ");
                    if (inviterNick && inviterNick.length < 3) return client.chat("Invalid inviter nickname!");

                    accept(client, inviterNick);
                    break;
                case "play":
                    if (!inGame(client)) return client.chat("You are not in a game!");

                    const x = args[1];
                    const y = args[2];

                    if (!x || !y) return client.chat("X or Y position is invalid!");

                    const ttt = gameGet(client);
                    if (!ttt) return client.chat("Error happened.");

                    const result = ttt.place(x, y, client.uid());
                    if (result !== true) return client.chat(result);

                    break;
                default:
                    return client.chat("Invalid subcommand!");
            }
        }
    });

    /**
     * Whether client is / is not in a TTT game
     *
     * @param   {Client}  client
     *
     * @return  {Boolean}        
     */
    function inGame(client) {
        return !!PLAYERS.get(client.uid());
    }

    /**
     * Save the game for both players
     *
     * @param   {Client}  c1    
     * @param   {Client}  c2    
     * @param   {TTT}  game  
     *
     * @return  {Boolean}
     */
    function gameSave(c1, c2, game) {
        return PLAYERS.set(c1.uid(), game) && PLAYERS.set(c2.uid(), game);
    }

    /**
     * Get client's current TTT game
     *
     * @param   {Client}  client
     *
     * @return  {TTT}        
     */
    function gameGet(client) {
        return PLAYERS.get(client.uid()) || false;
    }

    /**
     * Ends client's game
     *
     * @param   {String} uid find game by uid
     *
     */
    function gameEnd(uid) {
        const ttt = gameGet(uid);
        if (!ttt) throw new Error("Can't end game that does not exist!");
        return ttt.end();
    }

    /**
     * Starts a game between two players
     *
     * @param   {Client}  c1    
     * @param   {Client}  c2    
     * @param   {Number}  size 
     *
     * @return  {Boolean}
     */
    function gameStart(c1, c2, size) {
        const game = new TTT(c1, c2, size);
        return gameSave(c1, c2, game);
    }

    /*
    |
    | Client can invite only 1 person for a game at a time
    | Client can have infinite amount of invitations
    | Client can auto-accept invite without specifying nick if there is only one but if nick wasn't specified
    | Client can accept invite with a specific nick
    | Client can cancel previously sent invitation !!!!!!!!!!!
    | Client can not accept an invite that has expired, been deleted or does not exist
    */

    /**
     * Inviter invites a client, 
     *
     * @param   {Client}  client    
     * @param   {Client}  invitedClient
     *
     */
    function invite(client, invitedClient) {
        const inviterUID = client.uid();
        const invitedUID = invitedClient.uid();
        const inviterData = INVITERS[inviterUID] || {};

        // If inviter already invited someone?
        if (inviterData && inviterData.expiry > Date.now()) {
            return client.chat("You have already sent an invitation to someone!");
        } else {
            // Create new invitation object
            INVITERS[inviterUID] = {
                invited: invitedUID,
                expiry: Date.now() + INVITE_EXPIRE
            }

            // Add invitation to the invited list
            const invitedData = INVITES[invitedUID] || [];
            if (!invitedData.includes(inviterUID)) {
                invitedData.push(inviterUID);
                INVITES[invitedUID] = invitedData;
            }

            client.chat(`Invitation sent to: [b]${invitedClient.nick()}[/b]`);
            invitedClient.chat(`You've been invited by [b]${client.nick()}[/b] for a game of [b]Tic Tac Toe[/b]!`);
        }
    }

    /**
     * Accepts an invitation from someone
     *
     * @param   {Client}  client       
     * @param   {String}  inviterNick  
     *
     */
    function accept(client, inviterNick = false) {
        /**
         * Removes invitation from the invited client by inviter UID
         *
         * @param   {String}  uid  Inviter UID
         *  
         */
        const clearInvitedData = (uid) => {
            uidPosition = invitedData.indexOf(uid);
            if (uidPosition !== -1) {
                invitedData.splice(invitedData.indexOf(uid), true);
                INVITES[invitedUID] = invitedData;
            }
        };

        /**
         * Removes invitation at the inviter's side
         *
         * @param   {String}  inviterUID  UID of the inviter
         *  
         */
        const clearInviterData = (inviterUID) => {
            if (inviterUID)
                INVITERS[inviterUID] = {};
        }

        /**
         * Shows valid invitations for the client  
         */
        const showInvitations = () => {
            const invitesList = invitedData
                .map(uid => backend.getClientByUID(uid))
                .filter(c => c)
                .map(c => c.nick());
            return client.chat("Invitations - nicknames that invited you (" + invitesList.length + "):\n" + invitesList.join("[b],[/b] "));
        }

        const invitedUID = client.uid();
        const invitedData = INVITES[invitedUID] || [];

        if (invitedData.length <= 0) return client.chat("You don't have any pending invitation!");
        if (invitedData.length !== 1 && !inviterNick) return showInvitations();

        let inviter = false;
        let inviterUID = false;

        if (invitedData.length === 1) {
            inviterUID = invitedData[0]; // Index 0 is the inviter, because there is only one
            inviter = backend.getClientByUID(inviterUID);
        } else {
            const potentialInviter = backend.getClientByNick(inviterNick);
            if (!potentialInviter) return client.chat("Client with this nickname was not found!");

            const potentialInviterUID = potentialInviter.uid();
            inviterUID = invitedData.find(uid => uid === potentialInviterUID);
            if (!inviterUID) return client.chat("This client did not invite you!");
            else inviter = potentialInviter;
        }

        if (!inviter) {
            if (inviterUID) {
                clearInvitedData(inviterUID);
                clearInviterData(inviterUID);
            }
            return client.chat("Inviter is already offline...");
        } else {
            inviterUID = inviter.uid();
            const inviterData = INVITERS[inviterUID] || {};

            if (!inviterData || inviterData.invited !== invitedUID || inviterData.expiry < Date.now()) {
                return client.chat("Invitation expired or deleted!");
            } else {
                inviter.chat("Your invitation was accepted!");
                client.chat("Invitation accepted!");
                gameStart(inviter, client, FIELD_SIZE);
                clearInvitedData(inviterUID);
                clearInviterData(inviterUID);
                return;
            }
        }
    }

    engine.log(`\n[SUCCESS] Script: "${name}" Version: "${version}" Author: "${author}"`);
});