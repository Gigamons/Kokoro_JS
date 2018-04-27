// Consts
const Exceptions = require('./consts/Exceptions');
const Mods = require('./consts/mods');
const playModes = require('./consts/playModes');
const Privileges = require('./consts/privileges');
const rankedStatus = require('./consts/rankedStatus');

//Handlers
//const EventHandler = require('./handler/event');

// Helpers
const Crypto = require('./helpers/Crypto');
const getRank = require('./helpers/getRank');
const Logger = require('./helpers/logger');
const Token = require('./helpers/token');
const countryHelper = require('./helpers/country');
const ipHelper = require('./helpers/ip');
const PasswordHelper = require('./helpers/passwordhelper');
const PrivilegeHelper = require('./helpers/privilege');
const AccuracyHelper = require('./helpers/accuracy');

// Tools
const MySQLManager = require('./manager/mysql');
const RedisManager = require('./manager/redis');
const UserTools = require('./tools/user');
const EventTool = require('./tools/event');

/* I'll let this here to understand ASYNC again if i forget it.
async function test() {
    try {
        let id = await UserTools.getuserid('Mempler');
        let leaderboard = await UserTools.getLeaderBoard(id, 0);
    } catch (ex){
        console.log(ex)
    }
}
test();
*/

module.exports = {
    Exceptions,
    Mods,
    playModes,
    //EventHandler,
    getRank,
    Privileges,
    rankedStatus,
    countryHelper,
    ipHelper,
    Logger,
    Token,
    PasswordHelper,
    AccuracyHelper,
    PrivilegeHelper,
    MySQLManager,
    RedisManager,
    UserTools,
    EventTool,
    Crypto
};