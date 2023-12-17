registerPlugin({
    /*
    NOTE: This is old, most likely not functional script. Don't use.

    Linking accounts system WITH verification
    Some basic admin commands
    Configurable commands' permission by group IDs
    Anti-Spam feature
    Every single message is translatable
    Assign group (for ex. In-Game) when user is in-game
    Assign top 3 played champions groups (sorted by mastery points) - (you need to have all the champion groups created with )
    Assign group based on your rank (Gold, Diamond etc)
    You can specify which queue types to check (only TFT rank, only Solo / Duo, or all together..)
    And some other details that I do not remember at the moment
    */
    // API key
    // Register acount
    // verify account
    // reset whole db
    // changing api keys command
    // unlink cmd
    // link cmd
    // list cmd
    // spam
    // region
    // timeout verify
    // groups
    // admin groups
    // user groups
    // translatable messages
    // in-game group
    // mastery
    // count specific queue types
    name: "League Rank (developer.riotgames.com)",
    version: "0.1",
    description: "Give clients specified group based on their rank on League of Legends",
    author: "DrWarpMan <drwarpman@gmail.com>",
    backends: ["ts3"],
    engine: ">= 1.0",
    autorun: false,
    enableWeb: false,
    hidden: false,
    requiredModules: ["http"],
    vars: [{
            name: "lolApiKey",
            type: "string",
            title: "API key (leave empty, if you don\'t have your own)",
            placeholder: "Your API key"
        }, {
            name: "lolCommandAccount",
            type: "string",
            title: "[ADMIN / CLIENT] Command used to connect an account from League of Legends to TS3 account (identity) [SYNTAX: \"<command> <summonerName>\"]",
            default: "!lolaccount",
            placeholder: "!lolaccount"
        }, {
            name: "lolCommandVerify",
            type: "string",
            title: "[ADMIN / CLIENT] Command used to verify a connection between League of Legends account and TS3 account (identity) [SYNTAX: \"<command>\"]",
            default: "!lolverify",
            placeholder: "!lolverify"
        }, {
            name: "lolCommandResetDB",
            type: "string",
            title: "[ADMIN ONLY] Command used to reset the whole database [SYNTAX: \"<command>\"]",
            default: "!lolresetdb",
            placeholder: "!lolresetdb"
        }, {
            name: "lolCommandApiChange",
            type: "string",
            title: "[ADMIN ONLY] Command used when changing API keys [SYNTAX: \"<command>\"]",
            default: "!lolapichange",
            placeholder: "!lolapichange"
        }, {
            name: "lolCommandUnlink",
            type: "string",
            title: "[ADMIN / CLIENT] Command used to unlink account [SYNTAX: \"<command>\" OR if admin \"<command> <uid>\"]",
            default: "!lolunlink",
            placeholder: "!lolunlink"
        }, {
            name: "lolCommandLink",
            type: "string",
            title: "[ADMIN ONLY] Command used to link account (force linking account) [SYNTAX: \"<command> <uid> <summonerName>\"]",
            default: "!lollink",
            placeholder: "!lollink"
        }, {
            name: "lolCommandList",
            type: "string",
            title: "[ADMIN ONLY] Command used to list all accounts [SYNTAX: \"<command>\"]",
            default: "!lollist",
            placeholder: "!lollist"
        }, {
            name: "lolCommandMonthProgress",
            type: "string",
            title: "[ADMIN ONLY] Command used to show month progress [SYNTAX: \"<command>\"]",
            default: "!lolprogress",
            placeholder: "!lolprogress"
        }, {
            name: "lolInterval",
            type: "number",
            title: "How often should the script update ranks (in minutes) (value needs to be higher than 10):",
            default: 30,
            placeholder: "30"
        }, {
            name: "lolTimeout",
            type: "number",
            title: "How much time does the client have to verify his account (in seconds) (value needs to be higher than 60 and lower than 300):",
            default: 180,
            placeholder: "180"
        }, {
            name: "lolRegion",
            type: "select",
            title: "Choose region (Default is EUNE):",
            options: ['BR', 'EUNE', 'EUW', 'JP', 'KR', 'LAN', 'LAS', 'NA', 'OCE', 'TR', 'RU'],
            default: "1"
        }, {
            name: "lolAntiSpamTime",
            type: "number",
            title: "Time the client needs to wait between sending commands (in seconds) (Default is 5)",
            default: 5
        }, {
            name: "adminGroups",
            type: "strings",
            title: "Groups ID for admins (resetting database for ex.) (if you leave this empty, nobody can reset the database):"
        }, {
            name: "userGroups",
            type: "strings",
            title: "Groups ID for users (that can use this script - like linking / unlinking / verifying account) (if you leave this empty, everybody can use this script):"
        }, {
            name: "inGameGroupID",
            type: "string",
            title: "Group ID, to add when client is in game:"
        }, {
            name: "antiInGameGroupID",
            type: "string",
            title: "Group ID, that will prevent clients from being checked for in-game status:"
        }, {
            name: "customGroupID",
            type: "string",
            title: "Custom Group ID, to add when client is verified:"
        }, {
            name: "botUid",
            type: "string",
            title: "Unique ID, of a user (bot) to add Free Rotation champion groups to:"
        }, {
            name: 'lolSoloQueue',
            title: 'Check SOLO SR queue?',
            type: 'checkbox'
        }, {
            name: 'lolFlexSRQueue',
            title: 'Check FLEX SR queue?',
            type: 'checkbox'
        }, {
            name: 'lolFlexTTQueue',
            title: 'Check FLEX TT queue?',
            type: 'checkbox'
        }, {
            name: 'lolTFTQueue',
            title: 'Check RANKED TFT queue?',
            type: 'checkbox'
        }, {
            name: 'lolLinkCounter',
            title: 'Check to enable saving linking / unlinking monthly data',
            type: 'checkbox'
        },
        {
            name: 'rankChannelID',
            title: 'Channel to show top ranked players in (leave empty to disable this feature):',
            type: 'string'
        }, {
            name: "rankChannelDescription",
            type: "multiline",
            title: "Channel description, of channel specified above [Placeholder: %rankedList%]:",
        }, {
            name: "rankNickText",
            type: "string",
            title: "One nickname in channel description [Placeholder: %tsnickname%, %lolnickname%, %elo%]:",
            placeholder: "Elo: %elo% Nick: %tsnickname%",
            default: "Elo: %elo% Nick: %tsnickname%"
        }, {
            name: "topRankedAmount",
            type: "number",
            title: "Amount of top ranked players to show [Min: 1]:",
            placeholder: "10",
            default: 10
        },
        {
            name: 'lolShowRanksList',
            title: 'Show ranks and their groups',
            type: 'checkbox'
        }, {
            name: "lolRankUnranked",
            type: "string",
            title: "Group ID for Unranked:",
            placeholder: "28",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankIron4",
            type: "string",
            title: "Group ID for Iron IV:",
            placeholder: "27",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankIron3",
            type: "string",
            title: "Group ID for Iron III:",
            placeholder: "26",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankIron2",
            type: "string",
            title: "Group ID for Iron II:",
            placeholder: "25",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankIron1",
            type: "string",
            title: "Group ID for Iron I:",
            placeholder: "24",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankBronze4",
            type: "string",
            title: "Group ID for Bronze IV:",
            placeholder: "23",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankBronze3",
            type: "string",
            title: "Group ID for Bronze III:",
            placeholder: "22",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankBronze2",
            type: "string",
            title: "Group ID for Bronze II:",
            placeholder: "21",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankBronze1",
            type: "string",
            title: "Group ID for Bronze I:",
            placeholder: "20",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankSilver4",
            type: "string",
            title: "Group ID for Silver IV:",
            placeholder: "19",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankSilver3",
            type: "string",
            title: "Group ID for Silver III:",
            placeholder: "18",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankSilver2",
            type: "string",
            title: "Group ID for Silver II:",
            placeholder: "17",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankSilver1",
            type: "string",
            title: "Group ID for Silver I:",
            placeholder: "16",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankGold4",
            type: "string",
            title: "Group ID for Gold IV:",
            placeholder: "15",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankGold3",
            type: "string",
            title: "Group ID for Gold III:",
            placeholder: "14",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankGold2",
            type: "string",
            title: "Group ID for Gold II:",
            placeholder: "13",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankGold1",
            type: "string",
            title: "Group ID for Gold I:",
            placeholder: "12",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankPlatinum4",
            type: "string",
            title: "Group ID for Platinum IV:",
            placeholder: "11",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankPlatinum3",
            type: "string",
            title: "Group ID for Platinum III:",
            placeholder: "10",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankPlatinum2",
            type: "string",
            title: "Group ID for Platinum II:",
            placeholder: "9",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankPlatinum1",
            type: "string",
            title: "Group ID for Platinum I:",
            placeholder: "8",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankDiamond4",
            type: "string",
            title: "Group ID for Diamond IV:",
            placeholder: "7",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankDiamond3",
            type: "string",
            title: "Group ID for Diamond III:",
            placeholder: "6",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankDiamond2",
            type: "string",
            title: "Group ID for Diamond II:",
            placeholder: "5",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankDiamond1",
            type: "string",
            title: "Group ID for Diamond I:",
            placeholder: "4",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankMaster",
            type: "string",
            title: "Group ID for Master:",
            placeholder: "3",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankGrandMaster",
            type: "string",
            title: "Group ID for GrandMaster:",
            placeholder: "2",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        }, {
            name: "lolRankChallenger",
            type: "string",
            title: "Group ID for Challenger:",
            placeholder: "1",
            conditions: [{
                field: 'lolShowRanksList',
                value: 1,
            }]
        },
        {
            name: 'lolShowRanksCustom',
            title: 'Show rank custom names',
            type: 'checkbox'
        }, {
            name: "lolRankCustomUnranked",
            type: "string",
            title: "Custom name for Unranked:",
            placeholder: "Unranked",
            default: "Unranked",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomIron4",
            type: "string",
            title: "Custom name for Iron IV:",
            placeholder: "Iron IV",
            default: "Iron IV",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomIron3",
            type: "string",
            title: "Custom name for Iron III:",
            placeholder: "Iron III",
            default: "Iron III",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomIron2",
            type: "string",
            title: "Custom name for Iron II:",
            placeholder: "Iron II",
            default: "Iron II",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomIron1",
            type: "string",
            title: "Custom name for Iron I:",
            placeholder: "Iron I",
            default: "Iron I",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomBronze4",
            type: "string",
            title: "Custom name for Bronze IV:",
            placeholder: "Bronze IV",
            default: "Bronze IV",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomBronze3",
            type: "string",
            title: "Custom name for Bronze III:",
            placeholder: "Bronze III",
            default: "Bronze III",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomBronze2",
            type: "string",
            title: "Custom name for Bronze II:",
            placeholder: "Bronze II",
            default: "Bronze II",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomBronze1",
            type: "string",
            title: "Custom name for Bronze I:",
            placeholder: "Bronze I",
            default: "Bronze I",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomSilver4",
            type: "string",
            title: "Custom name for Silver IV:",
            placeholder: "Silver IV",
            default: "Silver IV",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomSilver3",
            type: "string",
            title: "Custom name for Silver III:",
            placeholder: "Silver III",
            default: "Silver III",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomSilver2",
            type: "string",
            title: "Custom name for Silver II:",
            placeholder: "Silver II",
            default: "Silver II",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomSilver1",
            type: "string",
            title: "Custom name for Silver I:",
            placeholder: "Silver I",
            default: "Silver I",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomGold4",
            type: "string",
            title: "Custom name for Gold IV:",
            placeholder: "Gold IV",
            default: "Gold IV",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomGold3",
            type: "string",
            title: "Custom name for Gold III:",
            placeholder: "Gold III",
            default: "Gold III",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomGold2",
            type: "string",
            title: "Custom name for Gold II:",
            placeholder: "Gold II",
            default: "Gold II",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomGold1",
            type: "string",
            title: "Custom name for Gold I:",
            placeholder: "Gold I",
            default: "Gold I",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomPlatinum4",
            type: "string",
            title: "Custom name for Platinum IV:",
            placeholder: "Platinum IV",
            default: "Platinum IV",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomPlatinum3",
            type: "string",
            title: "Custom name for Platinum III:",
            placeholder: "Platinum III",
            default: "Platinum III",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomPlatinum2",
            type: "string",
            title: "Custom name for Platinum II:",
            placeholder: "Platinum II",
            default: "Platinum II",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomPlatinum1",
            type: "string",
            title: "Custom name for Platinum I:",
            placeholder: "Platinum I",
            default: "Platinum I",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomDiamond4",
            type: "string",
            title: "Custom name for Diamond IV:",
            placeholder: "Diamond IV",
            default: "Diamond IV",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomDiamond3",
            type: "string",
            title: "Custom name for Diamond III:",
            placeholder: "Diamond III",
            default: "Diamond III",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomDiamond2",
            type: "string",
            title: "Custom name for Diamond II:",
            placeholder: "Diamond II",
            default: "Diamond II",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomDiamond1",
            type: "string",
            title: "Custom name for Diamond I:",
            placeholder: "Diamond I",
            default: "Diamond I",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomMaster",
            type: "string",
            title: "Custom name for Master:",
            placeholder: "Master",
            default: "Master",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomGrandMaster",
            type: "string",
            title: "Custom name for GrandMaster:",
            placeholder: "Grandmaster",
            default: "Grandmaster",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: "lolRankCustomChallenger",
            type: "string",
            title: "Custom name for Challenger:",
            placeholder: "Challenger",
            default: "Challenger",
            conditions: [{
                field: 'lolShowRanksCustom',
                value: 1,
            }]
        }, {
            name: 'lolShowTranslationList',
            title: 'Show translation',
            type: 'checkbox'
        }, {
            name: "lolMessageAlreadyAccount",
            type: "string",
            title: "MESSAGE: You already added your account!",
            default: "You already added your account!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageAccountFound",
            type: "string",
            title: "MESSAGE: Account found, now if you want to verify your account with your TS3 identity, write: [b]%cmd_verify%[/b]",
            default: "Account found, now if you want to verify your account with your TS3 identity, write: [b]%cmd_verify%[/b]",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageErrorSummoner",
            type: "string",
            title: "MESSAGE: Sorry, but an error occurred while getting a summoner!",
            default: "Sorry, but an error occurred while getting a summoner!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageInvalidSumName",
            type: "string",
            title: "MESSAGE: Invalid summoner name!",
            default: "Invalid summoner name!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageAddAccountFirst",
            type: "string",
            title: "MESSAGE: As first, you have to add an account, that you want to verify with this command: [b]%cmd_account%[/b]",
            default: "As first, you have to add an account, that you want to verify with this command: [b]%cmd_account%[/b]",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageAlreadyVerified",
            type: "string",
            title: "MESSAGE: You already verified your account!",
            default: "You already verified your account!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageHowToVerify",
            type: "string",
            title: "MESSAGE: You have 180 seconds, to put this code [b]%code%[/b] into your League of Legends client (Settings -> Verification) and [b]Save[/b] it. After that, write [b]%cmd_verify%[/b] again!",
            default: "You have 180 seconds, to put this code [b]%code%[/b] into your League of Legends client (Settings -> Verification) and [b]Save[/b] it. After that, write [b]%cmd_verify%[/b] again!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageVerifySuccessful",
            type: "string",
            title: "MESSAGE: You have successfully linked your TS3 account to your LoL account!",
            default: "You have successfully linked your TS3 account to your LoL account!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageInvalidCode",
            type: "string",
            title: "MESSAGE: Invalid third party code, try again. (Code: [b]%code%[/b])",
            default: "Invalid third party code, try again. (Code: [b]%code%[/b])",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageErrorCode",
            type: "string",
            title: "MESSAGE: Sorry, but an error occurred while checking your summoner\'s third party code!",
            default: "Sorry, but an error occurred while checking your summoner\'s third party code!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageAlreadyRegisteredBySomeone",
            type: "string",
            title: "MESSAGE: This account is already registered by someone!",
            default: "This account is already registered by someone!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageDBResetSuccess",
            type: "string",
            title: "MESSAGE: You successfully reset the database!",
            default: "You successfully reset the database!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageNoRights",
            type: "string",
            title: "MESSAGE: You don't have required permission to do this action!",
            default: "You don't have required permission to do this action!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageNoAccount",
            type: "string",
            title: "MESSAGE: No account found!",
            default: "No account found!",
            placeholder: "Translate this message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageUnlinkSuccessful",
            type: "string",
            title: "MESSAGE: Unlink successful!",
            default: "Unlink successful!",
            placeholder: "Translate message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageAntiSpam",
            type: "string",
            title: "MESSAGE: You need to wait before sending another command!",
            default: "You need to wait before sending another command!",
            placeholder: "Translate message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageTargetOffline",
            type: "string",
            title: "MESSAGE: Target is offline!",
            default: "Target is offline!",
            placeholder: "Translate message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageAccountLinkedSuccess",
            type: "string",
            title: "MESSAGE: Target account successfully linked with target TS3 identity!",
            default: "Target account successfully linked with target TS3 identity!",
            placeholder: "Translate message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageApiChangeStart",
            type: "string",
            title: "MESSAGE: API changing started, wait till it ends!",
            default: "API changing started, wait till it ends!",
            placeholder: "Translate message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }, {
            name: "lolMessageApiChangeEnd",
            type: "string",
            title: "MESSAGE: API changing ended!",
            default: "API changing ended!",
            placeholder: "Translate message here!",
            conditions: [{
                field: 'lolShowTranslationList',
                value: 1,
            }]
        }
    ],
    voiceCommands: []
}, (_, config, { name, version, author }) => {

    const engine = require("engine");
    const backend = require("backend");
    const http = require("http");
    const event = require("event");
    const store = require("store");

    let region = ["BR1", "EUN1", "EUW1", "JP1", "KR", "LA1", "LA2", "NA1", "OC1", "TR1", "RU"];

    let clientTimeouts = {};
    let antiSpamObject = {};

    if (config.lolSoloQueue && config.lolFlexSRQueue && config.lolFlexTTQueue && config.lolTFTQueue)
        return engine.log("You have to check at least one queue type!");

    let rankWeightsAndIDs = {
        CHALLENGERI: {
            weight: 27,
            groupID: config.lolRankChallenger
        },
        GRANDMASTERI: {
            weight: 26,
            groupID: config.lolRankGrandMaster
        },
        MASTERI: {
            weight: 25,
            groupID: config.lolRankMaster
        },
        DIAMONDI: {
            weight: 24,
            groupID: config.lolRankDiamond1
        },
        DIAMONDII: {
            weight: 23,
            groupID: config.lolRankDiamond2
        },
        DIAMONDIII: {
            weight: 22,
            groupID: config.lolRankDiamond3
        },
        DIAMONDIV: {
            weight: 21,
            groupID: config.lolRankDiamond4
        },
        PLATINUMI: {
            weight: 20,
            groupID: config.lolRankPlatinum1
        },
        PLATINUMII: {
            weight: 19,
            groupID: config.lolRankPlatinum2
        },
        PLATINUMIII: {
            weight: 18,
            groupID: config.lolRankPlatinum3
        },
        PLATINUMIV: {
            weight: 17,
            groupID: config.lolRankPlatinum4
        },
        GOLDI: {
            weight: 16,
            groupID: config.lolRankGold1
        },
        GOLDII: {
            weight: 15,
            groupID: config.lolRankGold2
        },
        GOLDIII: {
            weight: 14,
            groupID: config.lolRankGold3
        },
        GOLDIV: {
            weight: 13,
            groupID: config.lolRankGold4
        },
        SILVERI: {
            weight: 12,
            groupID: config.lolRankSilver1
        },
        SILVERII: {
            weight: 11,
            groupID: config.lolRankSilver2
        },
        SILVERIII: {
            weight: 10,
            groupID: config.lolRankSilver3
        },
        SILVERIV: {
            weight: 9,
            groupID: config.lolRankSilver4
        },
        BRONZEI: {
            weight: 8,
            groupID: config.lolRankBronze1
        },
        BRONZEII: {
            weight: 7,
            groupID: config.lolRankBronze2
        },
        BRONZEIII: {
            weight: 6,
            groupID: config.lolRankBronze3
        },
        BRONZEIV: {
            weight: 5,
            groupID: config.lolRankBronze4
        },
        IRONI: {
            weight: 4,
            groupID: config.lolRankIron1
        },
        IRONII: {
            weight: 3,
            groupID: config.lolRankIron2
        },
        IRONIII: {
            weight: 2,
            groupID: config.lolRankIron3
        },
        IRONIV: {
            weight: 1,
            groupID: config.lolRankIron4
        },
        UNRANKED: {
            weight: 0,
            groupID: config.lolRankUnranked
        },
    };

    if (config.lolInterval < 10) {
        config.lolInterval = 10;
        engine.log("Your interval is too low! Automatically changed to 10 minutes!");
    }

    if (config.lolTimeout > 300) {
        config.lolTimeout = 300;
        engine.log("Your \"verify\" time is too high! Automatically changed to 300 seconds!");
    }

    if (config.lolTimeout < 60) {
        config.lolTimeout = 60;
        engine.log("Your \"verify\" time is too low! Automatically changed to 60 seconds!");
    }

    if (config.lolAntiSpamTime < 5) {
        config.lolAntiSpamTime = 5;
        engine.log("Your time the client needs to wait between sending commands is too low! Automatically changed to 5 seconds!");
    }

    setInterval(updateClients, config.lolInterval * 1000 * 60);
    setTimeout(rankUpdateChannel, 1000 * 10);
    setInterval(rankUpdateChannel, 1000 * 180);
    setInterval(inGameCheck, 60 * 1000);

    if (config.botUid !== undefined)
        setInterval(freeRotationCheck, 60 * 1000);

    event.on("chat", async({ text, client }) => {

        let command = text.split(" ")[0].toLowerCase();
        let uid = client.uid();

        /**
         * 
         * ADMIN COMMAND - SHOW MONTH DATA
         * 
         */
        if (command === config.lolCommandMonthProgress) {
            if (existsAntiSpam(client)) {
                client.chat(config.lolMessageAntiSpam);
                return;
            } else startAntiSpam(client);

            if (hasRights(client)) {
                let secondPart = text.substr(text.indexOf(' ') + 1);
                showMonthProgress(client, secondPart);
            } else client.chat(config.lolMessageNoRights);
            return;
        }

        /**
         * 
         * ADMIN COMMAND - RESET DB
         * 
         */
        if (command === config.lolCommandResetDB) {
            if (existsAntiSpam(client)) {
                client.chat(config.lolMessageAntiSpam);
                return;
            } else startAntiSpam(client);

            if (hasRights(client)) {
                store.getKeys().forEach(key => store.unset(key));
                clientTimeouts = {};
                checkNonRegisteredClients();
                client.chat(config.lolMessageDBResetSuccess);
            } else client.chat(config.lolMessageNoRights);
            return;
        }

        /**
         * 
         * ADMIN COMMAND - CHANGE API
         * 
         */
        if (command === config.lolCommandApiChange) {
            if (existsAntiSpam(client)) {
                client.chat(config.lolMessageAntiSpam);
                return;
            } else startAntiSpam(client);

            if (hasRights(client)) {
                apiChange(client);
                client.chat(config.lolMessageApiChangeStart);
            } else client.chat(config.lolMessageNoRights);
            return;
        }

        /**
         * 
         * ADMIN COMMAND - LINK ACCOUNT
         * 
         */
        if (command === config.lolCommandLink) {
            if (existsAntiSpam(client)) {
                client.chat(config.lolMessageAntiSpam);
                return;
            } else startAntiSpam(client);

            if (hasRights(client) === false) {
                client.chat(config.lolMessageNoRights);
                return;
            }

            let secondPart = text.substr(text.indexOf(' ') + 1);

            let targetUID = secondPart.split(" ")[0];
            let targetSummonerName = secondPart.split(" ").slice(1).join(" ");
            let targetData = store.get(region[config.lolRegion] + targetUID);

            if (backend.getClientByUniqueID(targetUID)) {
                if (targetSummonerName && targetSummonerName.length > 0) { // If he entered any name

                    // stop if he already has an account
                    if (typeof targetData !== "undefined") {
                        client.chat(config.lolMessageAlreadyAccount);
                        return;
                    }

                    // if somebody has already this account connected AND verified, it will stop him to do it again
                    if (isRegistered(targetSummonerName)) {
                        client.chat(config.lolMessageAlreadyRegisteredBySomeone);
                        return;
                    }

                    try {
                        let summoner = await getSummonerByName(targetSummonerName); // Wait till we now if the account exists, if it does, get the data

                        // Save the data
                        store.set(region[config.lolRegion] + targetUID, {
                            summonerName: summoner.name,
                            summonerID: summoner.id,
                            accountID: summoner.accountId,
                            verified: true,
                            dateOfCreation: makeDateOfCreation(),
                            tsName: backend.getClientByUniqueID(targetUID).nick(),
                            elo: undefined
                        });

                        updateClient(backend.getClientByUniqueID(targetUID));
                        client.chat(config.lolMessageAccountLinkedSuccess);

                        if (config.lolLinkCounter)
                            saveLinkData(client);
                    } catch (e) {
                        engine.log(`Error while trying to get summoner: ${e}`); // Log the error
                        client.chat(config.lolMessageErrorSummoner); // Tell the client, that error occurred
                    }
                } else client.chat(config.lolMessageInvalidSumName); // He didn't enter any name
            } else client.chat(config.lolMessageTargetOffline); // Target not online
            return;
        }

        /**
         * 
         * ADMIN / USER COMMAND - UNLINK ACCOUNT
         * 
         */

        if (command === config.lolCommandUnlink) {
            if (existsAntiSpam(client)) {
                client.chat(config.lolMessageAntiSpam);
                return;
            } else startAntiSpam(client);

            let unlinkUID = text.split(" ").slice(1).join(" "); // UID to unlink

            if (hasUserRights(client) === false) {
                client.chat(config.lolMessageNoRights);
                return;
            }

            if (unlinkUID && unlinkUID.length > 0) {
                if (hasRights(client) === false) {
                    client.chat(config.lolMessageNoRights);
                    return;
                } else {
                    let targetData = store.get(region[config.lolRegion] + unlinkUID);

                    if (typeof targetData === "undefined") {
                        client.chat(config.lolMessageNoAccount);
                        return;
                    }

                    unlink(unlinkUID, client);
                    if (config.lolLinkCounter)
                        saveUnlinkData(client);
                }
            } else {
                let clientData = store.get(region[config.lolRegion] + uid);

                if (typeof clientData === "undefined") {
                    client.chat(config.lolMessageNoAccount);
                    return;
                }

                unlink(uid, client);
            }
            return;
        }

        /**
         * 
         * ADMIN COMMAND - LIST ACCOUNTS
         * 
         */

        if (command === config.lolCommandList) {
            if (existsAntiSpam(client)) {
                client.chat(config.lolMessageAntiSpam);
                return;
            } else startAntiSpam(client);

            if (hasRights(client) === false) {
                client.chat(config.lolMessageNoRights);
                return;
            }

            listAccounts(client);
            return;
        }

        /**
         * 
         * COMMAND - ADD ACCOUNT
         * 
         */
        if (command === config.lolCommandAccount) {

            if (existsAntiSpam(client)) {
                client.chat(config.lolMessageAntiSpam);
                return;
            } else startAntiSpam(client);

            if (hasUserRights(client) === false) {
                client.chat(config.lolMessageNoRights);
                return;
            }

            let summonerName = text.split(" ").slice(1).join(" "); // League of Legends summoner name
            let clientData = store.get(region[config.lolRegion] + uid);

            if (summonerName && summonerName.length > 0) { // If he entered any name

                // stop if he already has an account
                if (typeof clientData !== "undefined") {
                    client.chat(config.lolMessageAlreadyAccount);
                    return;
                }

                // if somebody has already this account connected AND verified, it will stop him to do it again
                if (isRegistered(summonerName)) {
                    client.chat(config.lolMessageAlreadyRegisteredBySomeone);
                    return;
                }

                try {
                    let summoner = await getSummonerByName(summonerName); // Wait till we now if the account exists, if it does, get the data

                    // Save the data
                    store.set(region[config.lolRegion] + uid, {
                        summonerName: summoner.name,
                        summonerID: summoner.id,
                        accountID: summoner.accountId,
                        verified: false,
                        dateOfCreation: makeDateOfCreation(),
                        tsName: client.nick(),
                        elo: undefined
                    });

                    client.chat(config.lolMessageAccountFound.replace("%cmd_verify%", config.lolCommandVerify));
                } catch (e) {
                    engine.log(`Error while trying to get summoner: ${e}`); // Log the error
                    client.chat(config.lolMessageErrorSummoner); // Tell the client, that error occurred
                }
            } else client.chat(config.lolMessageInvalidSumName); // He didn't enter any name

            return;
        }

        /**
         * 
         * COMMAND - VERIFY ACCOUNT
         * 
         */
        if (command === config.lolCommandVerify) {
            let clientData = store.get(region[config.lolRegion] + uid);

            if (typeof clientData === "undefined") {
                client.chat(config.lolMessageAddAccountFirst.replace("%cmd_account%", config.lolCommandAccount));
                return;
            }

            if (clientData.verified === true) {
                client.chat(config.lolMessageAlreadyVerified);
                return;
            }

            if (clientTimeouts[uid] === undefined) {

                let code = "";
                let numbers = "0123456789";
                for (let i = 0; i < 10; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));

                client.chat(config.lolMessageHowToVerify.replace("%code%", code).replace("%cmd_verify%", config.lolCommandVerify));

                clientTimeouts[uid] = {};
                clientTimeouts[uid].thirdPartyCode = code;
                clientTimeouts[uid].timeout = setTimeout(() => {
                    endClientTimeout(client);
                }, config.lolTimeout * 1000);
            } else if (clientTimeouts[uid] !== undefined) {
                if (existsAntiSpam(client)) {
                    client.chat(config.lolMessageAntiSpam);
                    return;
                } else startAntiSpam(client);

                try {
                    let summonerCode = await getSummonerCode(store.get(region[config.lolRegion] + uid).summonerID); // Wait till we get summoner's code
                    if (clientTimeouts[uid].thirdPartyCode === summonerCode) {
                        clientData.verified = true;
                        store.set(region[config.lolRegion] + uid, clientData);
                        client.chat(config.lolMessageVerifySuccessful);
                        updateClient(client);
                        checkDuplicates(clientData.summonerName, uid);
                    } else client.chat(config.lolMessageInvalidCode.replace("%code%", clientTimeouts[uid].thirdPartyCode));
                } catch (e) {
                    engine.log(`Error while trying to check summoner's code: ${e}`); // Log the error
                    client.chat(config.lolMessageErrorCode); // Tell the client, that error occurred
                }
            }
            return;
        }

    });

    /* ASYNC FUNCTIONS */

    async function getSummonerByName(name, callback, apiChangeRegion) {
        let regionToUse = (!apiChangeRegion) ? region[config.lolRegion] : apiChangeRegion;

        name = encodeURI(name);

        let apiUrl = (config.lolApiKey) ?
            `https://${regionToUse}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${config.lolApiKey}` :
            `http://185.91.116.132:4221/lol/summoner/v4/summoners/by-name/${name}?platform=${regionToUse}`;

        let httpObject = {
            method: "GET",
            timeout: 5000,
            url: apiUrl
        };

        return new Promise(
            (resolve, reject) => {
                http.simpleRequest(httpObject, (error, { statusCode, status, data }) => {
                    if (error) {
                        reject(error);
                        return engine.log(`Error: ${error}`);
                    }

                    if (statusCode !== 200) {
                        reject(`Unexpected status: ${status}`);
                        engine.log(apiUrl);
                        return engine.log(`HTTP Error: ${status}`);
                    }

                    resolve(JSON.parse(data));
                });
            }
        );
    }

    async function getSummonerByID(id, callback, apiChangeRegion) {
        let regionToUse = (!apiChangeRegion) ? region[config.lolRegion] : apiChangeRegion;

        let apiUrl = (config.lolApiKey) ?
            `https://${regionToUse}.api.riotgames.com/lol/summoner/v4/summoners/${id}?api_key=${config.lolApiKey}` :
            `http://185.91.116.132:4221/lol/summoner/v4/summoners/${id}?platform=${regionToUse}`;

        let httpObject = {
            method: "GET",
            timeout: 5000,
            url: apiUrl
        };

        return new Promise(
            (resolve, reject) => {
                http.simpleRequest(httpObject, (error, { statusCode, status, data }) => {
                    if (error) {
                        reject(error);
                        return engine.log(`Error: ${error}`);
                    }

                    if (statusCode !== 200) {
                        reject(`Unexpected status: ${status}`);
                        engine.log(apiUrl);
                        return engine.log(`HTTP Error: ${status}`);
                    }

                    resolve(JSON.parse(data));
                });
            }
        );
    }

    async function getSummonerCode(id, callback) {

        let apiUrl = (config.lolApiKey) ?
            `https://${region[config.lolRegion]}.api.riotgames.com/lol/platform/v4/third-party-code/by-summoner/${id}?api_key=${config.lolApiKey}` :
            `http://185.91.116.132:4221/lol/platform/v4/third-party-code/by-summoner/${id}?platform=${region[config.lolRegion]}`;

        let httpObject = {
            method: "GET",
            timeout: 5000,
            url: apiUrl
        };

        return new Promise(
            (resolve, reject) => {
                http.simpleRequest(httpObject, (error, { statusCode, status, data }) => {
                    if (error) {
                        reject(error);
                        return engine.log(`Error: ${error}`);
                    }

                    if (statusCode !== 200) {
                        reject(`Unexpected status: ${status}`);
                        engine.log(apiUrl);
                        return engine.log(`HTTP Error: ${status}`);
                    }

                    resolve(JSON.parse(data));
                });
            }
        );
    }

    async function getSummonerRank(id, callback) {

        let apiUrl = (config.lolApiKey) ?
            `https://${region[config.lolRegion]}.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}?api_key=${config.lolApiKey}` :
            `http://185.91.116.132:4221/lol/league/v4/entries/by-summoner/${id}?platform=${region[config.lolRegion]}`;

        let httpObject = {
            method: "GET",
            timeout: 5000,
            url: apiUrl
        };

        return new Promise(
            (resolve, reject) => {
                http.simpleRequest(httpObject, (error, { statusCode, status, data }) => {
                    if (error) {
                        reject(error);
                        return engine.log(`Error: ${error}`);
                    }

                    if (statusCode !== 200) {
                        reject(`Unexpected status: ${status}`);
                        engine.log(apiUrl);
                        return engine.log(`HTTP Error: ${status}`);
                    }

                    tempData = JSON.parse(data);

                    tempData = tempData.filter(i => i["queueType"] == "RANKED_SOLO_5x5" && config.lolSoloQueue || i["queueType"] == "RANKED_FLEX_SR" && config.lolFlexSRQueue || i["queueType"] == "RANKED_FLEX_TT" && config.lolFlexTTQueue || i["queueType"] == "RANKED_TFT" && config.lolTFTQueue);

                    resolve(tempData);
                });
            }
        );
    }

    async function getInGame(id, callback) {

        let apiUrl = (config.lolApiKey) ?
            `https://${region[config.lolRegion]}.api.riotgames.com/lol/spectator/v4/active-games/by-summoner/${id}?api_key=${config.lolApiKey}` :
            `http://185.91.116.132:4221/lol/spectator/v4/active-games/by-summoner/${id}?platform=${region[config.lolRegion]}`;

        let httpObject = {
            method: "GET",
            timeout: 5000,
            url: apiUrl
        };

        return new Promise(
            (resolve, reject) => {
                http.simpleRequest(httpObject, (error, { statusCode, status }) => {
                    if (error) {
                        reject(error);
                        return engine.log(`Error: ${error}`);
                    }

                    if (statusCode !== 200 && statusCode !== 404) {
                        reject(`Unexpected status: ${status}`);
                        engine.log(apiUrl);
                        return engine.log(`HTTP Error: ${status}`);
                    }

                    resolve(JSON.parse(statusCode));
                });
            }
        );
    }

    async function getFreeRotation(callback) {
        let apiUrl = (config.lolApiKey) ?
            `https://${region[config.lolRegion]}.api.riotgames.com/lol/platform/v3/champion-rotations?api_key=${config.lolApiKey}` :
            `http://185.91.116.132:4221/lol/platform/v3/champion-rotations?platform=${region[config.lolRegion]}`;

        let httpObject = {
            method: "GET",
            timeout: 5000,
            url: apiUrl
        };

        return new Promise(
            (resolve, reject) => {
                http.simpleRequest(httpObject, (error, { statusCode, status, data }) => {
                    if (error) {
                        reject(error);
                        return engine.log(`Error: ${error}`);
                    }

                    if (statusCode !== 200) {
                        reject(`Unexpected status: ${status}`);
                        engine.log(apiUrl);
                        return engine.log(`HTTP Error: ${status}`);
                    }

                    resolve(JSON.parse(data));
                });
            }
        );
    }

    async function getVersion(callback) {
        let apiUrl = "http://ddragon.leagueoflegends.com/api/versions.json";

        let httpObject = {
            method: "GET",
            timeout: 5000,
            url: apiUrl
        };

        return new Promise(
            (resolve, reject) => {
                http.simpleRequest(httpObject, (error, { statusCode, status, data }) => {
                    if (error) {
                        reject(error);
                        return engine.log(`Error: ${error}`);
                    }

                    if (statusCode !== 200) {
                        reject(`Unexpected status: ${status}`);
                        engine.log(apiUrl);
                        return engine.log(`HTTP Error: ${status}`);
                    }

                    resolve(JSON.parse(data)[0]);
                });
            }
        );
    }


    async function getChampions(version, callback) {
        let apiUrl = `http://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`;

        let httpObject = {
            method: "GET",
            timeout: 5000,
            url: apiUrl
        };

        return new Promise(
            (resolve, reject) => {
                http.simpleRequest(httpObject, (error, { statusCode, status, data }) => {
                    if (error) {
                        reject(error);
                        return engine.log(`Error: ${error}`);
                    }

                    if (statusCode !== 200) {
                        reject(`Unexpected status: ${status}`);
                        engine.log(apiUrl);
                        return engine.log(`HTTP Error: ${status}`);
                    }

                    resolve(JSON.parse(data));
                });
            }
        );
    }

    async function getMastery(id, callback) {
        let apiUrl = (config.lolApiKey) ?
            `https://${region[config.lolRegion]}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${id}?api_key=${config.lolApiKey}` :
            `http://185.91.116.132:4221/lol/champion-mastery/v4/champion-masteries/by-summoner/${id}?platform=${region[config.lolRegion]}`;

        let httpObject = {
            method: "GET",
            timeout: 5000,
            url: apiUrl
        };

        return new Promise(
            (resolve, reject) => {
                http.simpleRequest(httpObject, (error, { statusCode, status, data }) => {
                    if (error) {
                        reject(error);
                        return engine.log(`Error: ${error}`);
                    }

                    if (statusCode !== 200) {
                        reject(`Unexpected status: ${status}`);
                        engine.log(apiUrl);
                        return engine.log(`HTTP Error: ${status}`);
                    }

                    resolve(JSON.parse(data));
                });
            }
        );
    }


    /*async function getSales(callback) {
        let apiUrl = "https://store.eun1.lol.riotgames.com/storefront/v1/catalog?region=EUN1&language=en_US";

        let httpObject = {
            method: "GET",
            timeout: 5000,
            url: apiUrl
        };

        return new Promise(
            function(resolve, reject) {
                http.simpleRequest(httpObject, function(error, response) {
                    if (error) {
                        reject(error);
                        return engine.log("Error: " + error);
                    }

                    if (response.statusCode !== 200) {
                        reject("Unexpected status: " + response.status);
                        engine.log(apiUrl);
                        return engine.log("HTTP Error: " + response.status);
                    }

                    resolve(JSON.parse(response.data).filter(i => i.sale !== undefined));
                });
            }
        );
    }*/

    async function freeRotationCheck() {
        let version = await getVersion();
        let champions = await getChampions(version);
        let championIDsNamesObject = getChampionIDsNamesObject(champions);
        let freeRotation = await getFreeRotation();
        let freeChampions = [];

        freeRotation["freeChampionIds"].forEach(id => {
            freeChampions.push(championIDsNamesObject[id]);
        });

        removeNonFreeChampionGroups(championIDsNamesObject, freeChampions);

        freeChampions.forEach(champion => {
            let group = getServerGroupByName(champion);
            let bot = backend.getClientByUID(config.botUid);

            if (bot && group && hasServerGroupWithID(bot, group.id()) === false) {
                bot.addToServerGroup(group.id());
            };
        });

    }

    function getChampionIDsNamesObject({ data }) {
        let championsObject = {};

        Object.keys(data).forEach(champion => {
            championsObject[data[champion].key] = data[champion].name;
        });

        return championsObject;
    }

    async function getSummonerTopMastery(id) {
        let version = await getVersion();
        let champions = await getChampions(version);
        let championIDsNamesObject = getChampionIDsNamesObject(champions);
        let masteryAll = await getMastery(id);

        let topMastery = [];

        let count = 0;

        masteryAll.forEach(i => {
            if (i) {
                count++;
                if (count <= 3) {
                    topMastery.push(championIDsNamesObject[i["championId"]]);
                }
            }
        });

        return { "mastery": topMastery, "allNames": Object.values(championIDsNamesObject) };
    }


    function getServerGroupByName(name) {
        return backend.getServerGroups().find(group => group.name() == name);
    }

    function removeNonFreeChampionGroups(championsObject, freeChampions) {
        Object.values(championsObject).forEach(championName => {
            let group = getServerGroupByName(championName);
            let bot = backend.getClientByUID(config.botUid);

            if (bot && group && hasServerGroupWithID(bot, group.id()) && Object.values(freeChampions).includes(championName) === false)
                bot.removeFromServerGroup(group.id());

        });
    }

    /* CHECK FOR IN-GAME */
    function inGameCheck() {
        if (config.inGameGroupID !== undefined) {
            if (backend.getServerGroupByID(config.inGameGroupID)) {
                backend.getClients().forEach(async client => {
                    let clientData = store.get(region[config.lolRegion] + client.uid());

                    if (clientData) {
                        if (clientData.verified) {
                            if (!hasServerGroupWithID(client, config.antiInGameGroupID)) {
                                try {
                                    let inGame = await getInGame(clientData.summonerID); // Wait for the in-game data
                                    if (inGame === 200) {
                                        if (hasServerGroupWithID(client, config.inGameGroupID) === false)
                                            client.addToServerGroup(config.inGameGroupID);
                                    } else {
                                        if (hasServerGroupWithID(client, config.inGameGroupID) === true)
                                            client.removeFromServerGroup(config.inGameGroupID);
                                    }
                                } catch (e) {
                                    return engine.log(`In-Game Error: ${response.status}`);
                                }
                            }
                        }
                    }
                });
            }
        }
    }

    /* UPDATE CLIENTS */

    function updateClients() {
        checkNonRegisteredClients();

        let keys = store.getKeys();

        loopThroughClients(0, keys.length, keys);
    }

    async function loopThroughClients(index, keysLength, keys) {
        if (index < keysLength) {
            let currentKey = keys[index];

            if (currentKey.substring(0, region[config.lolRegion].length) === region[config.lolRegion]) { // If region of client is the same as in the web interface
                let uid = currentKey.substring(region[config.lolRegion].length); // Get UID from key
                let client = backend.getClientByUID(uid); // Get client by UID
                //if (client) { // If client is connected
                let clientData = store.get(currentKey); // Get value of the key from DB
                if (clientData.verified === true) { // If client is verified
                    try {
                        // Top Mastery
                        let summonerTopMastery = await getSummonerTopMastery(clientData.summonerID);

                        if (client) {
                            let allChampionNames = summonerTopMastery["allNames"];
                            let topMastery = summonerTopMastery["mastery"];

                            if (topMastery.length > 0) {
                                topMastery.forEach(j => {
                                    let group = getServerGroupByName(j);

                                    if (group) {
                                        if (hasServerGroupWithID(client, group.id()) === false)
                                            client.addToServerGroup(group.id());
                                    }
                                });
                            }

                            allChampionNames.forEach(j => {
                                if (!topMastery.includes(j)) {
                                    let group = getServerGroupByName(j);

                                    if (group) {
                                        if (hasServerGroupWithID(client, group.id()) === true)
                                            client.removeFromServerGroup(group.id());
                                    }
                                }
                            });

                            clientData.tsName = backend.getClientByUniqueID(uid).nick(); // Update TS3 nickname
                        }

                        // Rank & summoner name update

                        let rankData = await getSummonerRank(clientData.summonerID); // Wait for the rank data
                        let summonerData = await getSummonerByID(clientData.summonerID); // wait for summoner data
                        let highestRank;

                        if (rankData.length > 1) {
                            let ranks = [];
                            rankData.forEach(j => {
                                let rank = j.tier + j.rank;
                                if (ranks.includes(rank) === false)
                                    ranks.push(rank);
                            });
                            highestRank = getHighestRank(ranks);
                        } else if (rankData.length === 1) {
                            highestRank = rankData[0].tier + rankData[0].rank;
                        } else if (rankData.length < 1) {
                            highestRank = "UNRANKED";
                        }

                        clientData.elo = highestRank; // Update rank
                        clientData.summonerName = summonerData.name; // Update nickname

                        store.set(currentKey, clientData); // SAVE

                        if (client)
                            setGroupBasedOnRank(client, highestRank); // Give group based on rank
                    } catch (e) {
                        engine.log(`Error while trying to get rank: ${e}`); // Log the error
                    }
                }
                //}
            }
            setTimeout(() => {
                loopThroughClients(index + 1, keysLength, keys);
            }, (index % 100 == 0 && index != 0) ? 15 * 1000 : 1);
        }
    }

    function rankUpdateChannel() {
        if (!(rankChannel = backend.getChannelByID(config.rankChannelID)))
            return;

        if (config.rankChannelDescription) {
            let clientDatas = [];
            let keys = store.getKeys();

            keys.forEach(key => {
                if (key.startsWith(region[config.lolRegion])) {
                    let clientData = store.get(key); // Get value of the key from DB

                    if (clientData.verified === true) {
                        clientData["keyName"] = key;
                        clientDatas.push(clientData);
                    }
                }
            });

            clientDatas.sort((a, b) => (rankWeightsAndIDs[a.elo].weight < rankWeightsAndIDs[b.elo].weight) ? 1 : -1);
            clientDatas = clientDatas.slice(0, config.topRankedAmount);

            let rankList = "";

            clientDatas.forEach(({ elo, tsName, summonerName }) => {
                rankList += `${config.rankNickText.replace("%elo%", getEloFormat(elo)).replace("%tsnickname%", tsName).replace("%lolnickname%", summonerName)}\n`;
            });

            let newDescription = config.rankChannelDescription.replace("%rankedList%", rankList);
            rankChannel.setDescription(newDescription);
        }

    }

    function getEloFormat(elo) {
        let varName = "lolRankCustom";

        switch (elo) {
            case "CHALLENGERI":
                varName += "Challenger";
                break;
            case "GRANDMASTERI":
                varName += "GrandMaster";
                break;
            case "MASTERI":
                varName += "Master";
                break;
            case "DIAMONDI":
                varName += "Diamond1";
                break;
            case "DIAMONDII":
                varName += "Diamond2";
                break;
            case "DIAMONDIII":
                varName += "Diamond3";
                break;
            case "DIAMONDIV":
                varName += "Diamond4";
                break;
            case "PLATINUMI":
                varName += "Platinum1";
                break;
            case "PLATINUMII":
                varName += "Platinum2";
                break;
            case "PLATINUMIII":
                varName += "Platinum3";
                break;
            case "PLATINUMIV":
                varName += "Platinum4";
                break;
            case "GOLDI":
                varName += "Gold1";
                break;
            case "GOLDII":
                varName += "Gold2";
                break;
            case "GOLDIII":
                varName += "Gold3";
                break;
            case "GOLDIV":
                varName += "Gold4";
                break;
            case "SILVERI":
                varName += "Silver1";
                break;
            case "SILVERII":
                varName += "Silver2";
                break;
            case "SILVERIII":
                varName += "Silver3";
                break;
            case "SILVERIV":
                varName += "Silver4";
                break;
            case "BRONZEI":
                varName += "Bronze1";
                break;
            case "BRONZEII":
                varName += "Bronze2";
                break;
            case "BRONZEIII":
                varName += "Bronze3";
                break;
            case "BRONZEIV":
                varName += "Bronze4";
                break;
            case "IRONI":
                varName += "Iron1";
                break;
            case "IRONII":
                varName += "Iron2";
                break;
            case "IRONIII":
                varName += "Iron3";
                break;
            case "IRONIV":
                varName += "Iron4";
                break;
            case "UNRANKED":
                varName += "Unranked";
                break;
        }

        return config[`${varName}`];
    }

    /* UPDATE SPECIFIED CLIENT */

    async function updateClient(client) {
        let clientData = store.get(region[config.lolRegion] + client.uid());

        if (!clientData)
            return;

        if (clientData.verified === false)
            return;

        if (config.customGroupID !== undefined)
            if (hasServerGroupWithID(client, config.customGroupID) === false)
                client.addToServerGroup(config.customGroupID);

        try {
            let rankData = await getSummonerRank(clientData.summonerID); // Wait for the rank data
            let highestRank;

            if (rankData.length > 1) {
                let ranks = [];
                rankData.forEach(i => {
                    let rank = i.tier + i.rank;
                    if (ranks.includes(rank) === false)
                        ranks.push(rank);
                });
                highestRank = getHighestRank(ranks);
            } else if (rankData.length === 1) {
                highestRank = rankData[0].tier + rankData[0].rank;
            } else if (rankData.length < 1) {
                highestRank = "UNRANKED";
            }

            clientData.elo = highestRank;

            store.set(region[config.lolRegion] + client.uid(), clientData);

            setGroupBasedOnRank(client, highestRank);

            if (backend.getClientByUID(client.uid())) {
                let summonerTopMastery = await getSummonerTopMastery(clientData.summonerID);
                let allChampionNames = summonerTopMastery["allNames"];
                summonerTopMastery = summonerTopMastery["mastery"];

                if (summonerTopMastery.length > 0) {
                    summonerTopMastery.forEach(i => {
                        let group = getServerGroupByName(i);

                        if (group) {
                            if (hasServerGroupWithID(client, group.id()) === false)
                                client.addToServerGroup(group.id());
                        }
                    });
                }

                allChampionNames.forEach(i => {
                    if (!summonerTopMastery.includes(i)) {
                        let group = getServerGroupByName(i);

                        if (group) {
                            if (hasServerGroupWithID(client, group.id()) === true)
                                client.removeFromServerGroup(group.id());
                        }
                    }
                });
            }

        } catch (e) {
            engine.log(`Error while trying to get rank: ${e}`); // Log the error
        }
    }

    /**
     * Check non registered clients, and remove group if they shouldn't have it
     */
    function checkNonRegisteredClients() {
        backend.getClients().forEach(client => {
            let uid = client.uid();
            if (store.get(region[config.lolRegion] + uid) === undefined || store.get(region[config.lolRegion] + uid).verified === false) {
                for (let item in rankWeightsAndIDs) {
                    if (rankWeightsAndIDs.hasOwnProperty(item)) {
                        if (hasServerGroupWithID(client, rankWeightsAndIDs[item].groupID) === true)
                            client.removeFromServerGroup(rankWeightsAndIDs[item].groupID);
                    }
                }

                if (config.customGroupID !== undefined)
                    if (hasServerGroupWithID(client, config.customGroupID))
                        client.removeFromServerGroup(config.customGroupID);

                removeChampionIcons(client);
            }
        });
    }

    async function removeChampionIcons(client) {

        if (client.uid() == config.botUid)
            return;

        let version = await getVersion();
        let champions = await getChampions(version);

        Object.keys(champions.data).forEach(champion => {
            let championName = champions.data[champion].name;
            let group = getServerGroupByName(championName);

            if (group) {
                if (hasServerGroupWithID(client, group.id())) {
                    client.removeFromServerGroup(group.id());
                }
            }
        });
    }

    function listAccounts(client) {
        let keys = store.getKeys();
        keys.forEach(keyName => {
            let key = store.get(keyName);
            let uid = keyName.substring(region[config.lolRegion].length);
            let reg = keyName.substring(0, region[config.lolRegion].length);
            if (reg === region[config.lolRegion] && key.verified) {
                let accountTextFormat = `[b]TS name:[/b] [URL=client://0/${uid}]${key.tsName}[/URL] [b]([/b] ${uid} [b])[/b] [b]Summoner Name:[/b] ${key.summonerName} [b]Date of creation:[/b] ${key.dateOfCreation}`;
                client.chat(accountTextFormat);
            }
        });
    }

    /**
     * Gets the highest LoL rank from specified ranks
     * @param  {Array} ranks Array filled with ranks
     * @return {string}       Highest rank
     */
    function getHighestRank(ranks) {
        let numbers = {};
        ranks.forEach(rank => numbers[rankWeightsAndIDs[rank].weight] = rank);
        return numbers[Math.max(...Object.keys(numbers))];
    }

    function setGroupBasedOnRank(client, rank) {
        if (hasServerGroupWithID(client, rankWeightsAndIDs[rank].groupID) === false)
            client.addToServerGroup(rankWeightsAndIDs[rank].groupID);

        for (let item in rankWeightsAndIDs) {
            if (rankWeightsAndIDs.hasOwnProperty(item)) {
                if (hasServerGroupWithID(client, rankWeightsAndIDs[item].groupID) === true && rankWeightsAndIDs[rank].groupID !== rankWeightsAndIDs[item].groupID)
                    client.removeFromServerGroup(rankWeightsAndIDs[item].groupID);
            }
        }
    }

    /**
     * Checks whether client has specified group or not
     * @return {Boolean}
     */
    function hasServerGroupWithID(client, id) {
        return client.getServerGroups().some(group => group.id() == id);
    }

    function endClientTimeout(client) {
        delete clientTimeouts[client.uid()];
    }

    function isRegistered(name) {
        let exists = false;
        store.getKeys().forEach(key => {
            let data = store.get(key);
            if (key.substring(0, region[config.lolRegion].length) === region[config.lolRegion]) {
                if (data.summonerName.toLowerCase() === name.toLowerCase() && data.verified === true && exists === false)
                    exists = true;
            }
        });
        return exists;
    }

    function checkDuplicates(name, uid) {
        store.getKeys().forEach(key => {
            let data = store.get(key);
            if (key.substring(region[config.lolRegion].length) !== uid) {
                if (key.substring(0, region[config.lolRegion].length) === region[config.lolRegion]) {
                    if (data.summonerName.toLowerCase() === name.toLowerCase() && data.verified === false)
                        store.unset(key);
                }
            }
        });
    }

    /**
     * Checking whether the client has / doesn't admin rights
     * @param  {Client} client The client, that is being checked
     * @return {boolean}        Whether he has / doesn't have
     */
    function hasRights(client) {
        if (config.adminGroups === undefined)
            return false;
        else return checkArrays(client.getServerGroups().map(group => group.id()), config.adminGroups);
    }

    /**
     * Checking whether the client has / doesn't user rights
     * @param  {Client} client The client, that is being checked
     * @return {boolean}        Whether he has / doesn't have
     */
    function hasUserRights(client) {
        if (config.userGroups === undefined)
            return true;
        else if (hasRights(client))
            return true;
        else return checkArrays(client.getServerGroups().map(group => group.id()), config.userGroups);
    }

    /**
     * Checking if two arrays have at least one same item
     * @param  {array} arr1 First array
     * @param  {array} arr2 Second array
     * @return {boolean}      Whether they have / don't have at least one same item
     */
    function checkArrays(arr1, arr2) {
        return arr2.some(item => arr1.includes(item));
    }

    function makeDateOfCreation() {
        let d = new Date();
        let minutes = d.getMinutes();
        let hours = d.getHours();
        let day = d.getDate();
        let month = d.getMonth() + 1;
        let year = d.getFullYear();

        if (minutes < 10)
            minutes = `0${minutes}`;
        if (hours < 10)
            hours = `0${hours}`;
        if (day < 10)
            day = `0${day}`;
        if (month < 10)
            month = `0${month}`;

        let dateFormat = `${day}.${month}.${year}, ${hours}:${minutes}`;

        return dateFormat;
    }

    function unlink(uid, client) {
        store.unset(region[config.lolRegion] + uid);
        checkNonRegisteredClients();
        client.chat(config.lolMessageUnlinkSuccessful);
    }

    function startAntiSpam(client) {
        antiSpamObject[client.getIPAddress()] = setTimeout(() => {
            endAntiSpam(client);
        }, config.lolAntiSpamTime * 1000);
    }

    function endAntiSpam(client) {
        delete antiSpamObject[client.getIPAddress()];
    }

    function existsAntiSpam(client) {
        return (client.getIPAddress() in antiSpamObject);
    }

    function apiChange(client) { // IMPROVE 20 p 1S 100 p 2M
        let allKeys = store.getKeys().reduce((acc, curr, index) => {
            if (index % 20 === 0) acc.push([])
            acc[acc.length - 1].push(curr)
            return acc
        }, []);

        let time = 0;

        allKeys.forEach((keys, index) => {
            loopApiChange(keys, time);
            if (index != (allKeys.length - 1))
                time += 120 * 1000;
        });

        setTimeout(() => {
            client.chat(config.lolMessageApiChangeEnd);
        }, time);
    }

    function loopApiChange(keys, time) {
        setTimeout(() => {
            keys.forEach(async keyName => {
                let regTest = keyName.substring(0, 3);
                let reg = (region.includes(regTest)) ? keyNamse.substring(0, 3) : keyName.substring(0, 4);
                //let uid = keyName.substring(reg.length);
                let key = store.get(keyName);
                let summonerName = key.summonerName;

                try {
                    let summoner = await getSummonerByName(summonerName);

                    key["summonerID"] = summoner.id;
                    key["accountID"] = summoner.accountId;

                    store.set(keyName, key);
                } catch (e) {
                    engine.log(`Error while trying to get summoner: ${e}`); // Log the error
                }
            });
        }, time);
    }

    store.unset(`${new Date().getMonth() + 1} ${new Date().getFullYear()}`);

    function saveLinkData(admin) {
        let month = new Date().getMonth() + 1;
        let year = new Date().getFullYear();
        let key = `${month} ${year}`;
        let keyData = store.get(key);
        let newData = keyData;

        let aUID = admin.uid();
        let aNick = admin.nick();

        if (keyData === undefined) {
            let data = {};
            data[aUID] = {
                "linked": 1,
                "unlinked": 0,
                "lastNick": aNick
            };

            store.set(key, data);
        } else { // if data exists
            if (keyData[aUID] === undefined) // but if this exact client data do not exist
            {
                newData[aUID] = {
                    "linked": 1,
                    "unlinked": 0,
                    "lastNick": aNick
                };
            } else {
                let unlinked = keyData[aUID]["unlinked"];
                let linked = keyData[aUID]["linked"];

                newData[aUID] = {
                    "linked": linked + 1,
                    "unlinked": unlinked,
                    "lastNick": aNick
                };
            }

            store.set(key, newData);
        }

        engine.log(store.get(`${new Date().getMonth() + 1} ${new Date().getFullYear()}`));
    }

    function saveUnlinkData(admin) {
        let month = new Date().getMonth() + 1;
        let year = new Date().getFullYear();
        let key = `${month} ${year}`;
        let keyData = store.get(key);
        let newData = keyData;

        let aUID = admin.uid();
        let aNick = admin.nick();

        if (keyData === undefined) {
            let data = {};
            data[aUID] = {
                "linked": 0,
                "unlinked": 1,
                "lastNick": aNick
            };

            store.set(key, data);
        } else { // if data exists
            if (keyData[aUID] === undefined) // but if this exact client data do not exist
            {
                newData[aUID] = {
                    "linked": 0,
                    "unlinked": 1,
                    "lastNick": aNick
                };
            } else {
                let unlinked = keyData[aUID]["unlinked"];
                let linked = keyData[aUID]["linked"];

                newData[aUID] = {
                    "linked": linked,
                    "unlinked": unlinked + 1,
                    "lastNick": aNick
                };
            }

            store.set(key, newData);
        }
    }

    function showMonthProgress(client, month) {
        if (!month || month <= 0 || month >= 13)
            month = new Date().getMonth() + 1;
        let year = new Date().getFullYear();
        let key = `${month} ${year}`;
        let currentProgress = store.get(key);

        if (currentProgress === undefined)
            return client.chat("No progress found!");

        let msg = `\n[b]LoL Progress:[/b]\n`;

        Object.keys(currentProgress).forEach(adminUID => {
            let oneAdmin = ``;
            oneAdmin += `[URL=client://0/${adminUID}]${currentProgress[adminUID].lastNick}[/URL] `;
            oneAdmin += `(${adminUID}) `;
            oneAdmin += `[b]LINKED:[/b] ${currentProgress[adminUID].linked} `;
            oneAdmin += `[b]UNLINKED:[/b] ${currentProgress[adminUID].unlinked} `;
            oneAdmin += `[b]TOTAL:[/b] ${currentProgress[adminUID].linked - currentProgress[adminUID].unlinked} `;
            msg += `${oneAdmin}\n`;
        });

        client.chat(msg);
    }

    // SCRIPT LOADED SUCCCESFULLY
    engine.log(`\n[Script] "${name}" [Version] "${version}" [Author] "${author}"`);
});