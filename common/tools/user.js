const MySQL = require('../manager/mysql');
const redis = require('../manager/redis');
const passhelper = require('../helpers/passwordhelper');
const logger = require('../helpers/logger');
const eventtool = require('./event');

/**
 * @param {string} username
 * @description Returns a UserID from an safe/unsafe username.
 */
async function getuserid(username) {
  let safe = username.replace(new RegExp(" ", "g"), '_').toLowerCase();
  let result = await MySQL.query('SELECT id FROM users WHERE username_safe = ?', safe);
  if (result) {
    if (result[0])
      return Number(result[0].id)
    else return 0;
  }
}

/**
 * @param {number} userid
 * @description getusername Returns a Object from an UserID username.
 */
async function getusername(userid) {
  let result = await MySQL.query('SELECT username, username_safe FROM users WHERE id = ?', userid);
  if (result) {
    if (result[0])
      return {
        username: result[0]['username'],
        username_safe: result[0]['username_safe']
      };
    else return false;
  }
}

/**
 * @param {number} userid
 * @param {string} passhashmd5
 * @description Checks if password is Correct
 * @returns bool
 */
async function checkAuth(userid, passhashmd5) {
  let result = await MySQL.query('SELECT password FROM users WHERE id = ?', userid);
  return passhelper.check(result[0].password, passhashmd5)
}

/**
 * @param {number} userid
 * @param {string} passhashmd5
 * @description Checks if user is LoggedIn on Bancho and if password is right
 * @returns {boolean}
 */
async function checkLoggedIn(userid, passhashmd5) {
  return new Promise(async (resolve, reject) => {
    resolve(Boolean((await MySQL.query('SELECT * FROM banchotokens WHERE userid = ?', userid))[0]) || Boolean(await checkAuth(userid, passhashmd5)))
  });
}

/**
 * @param {Number} userid
 * @description returns a UserObject with all Needed userdata.
 */
async function getuser(userid) {
  let result = await MySQL.query('SELECT * FROM users WHERE id = ? LIMIT 1', userid);
  let result2 = await MySQL.query('SELECT * FROM users_status WHERE id = ? LIMIT 1', userid);
  return {
    UserID: Number(result[0].id),
    UserName: String(result[0].username),
    UserName_Safe: String(result[0].username_safe),
    EMail: String(result[0].email),
    Privileges: Number(result[0].privileges),
    Banned: {
      status: Boolean(result2[0].banned),
      until: result2[0].banned_until,
      reason: String(result2[0].banned_reason)
    },
    Silenced: {
      status: Number(result2[0].silenced),
      until: Number(result2[0].silenced_until),
      reason: String(result2[0].silenced_reason)
    }
  }
}

/**
 * @param {number} userid
 * @param {string} reason
 * @description bans a UserID to prevent that the user comes online again
 */
async function banUser(userid, reason) {
  await MySQL.query('UPDATE users_status SET banned = ?, banned_reason = ? WHERE id = ?', 1, reason, userid);
  await eventtool.WriteKick(userid, 'Banned!');
}

/**
 * @param {int} userid
 * @param {int} playmode
 * @param {bool} relaxing
 * @description bans a UserID to prevent that the user comes online again
 */
async function getLeaderBoard(userid, playmode, relaxing) {
  if (playmode === 0)
    playmode = "std";
  else if (playmode === 1)
    playmode = "taiko";
  else if (playmode === 2)
    playmode = "ctb";
  else if (playmode === 3)
    playmode = "mania";
  else return false;
  let result;
  if (relaxing) result = await MySQL.query('SELECT * FROM leaderboard_rx STRAIGHT_JOIN users_status ON leaderboard_rx.id = users_status.id WHERE (users_status.banned < 1) ORDER BY pp_' + playmode + ' DESC, rankedscore_' + playmode + ' DESC')
  else result = await MySQL.query('SELECT * FROM leaderboard STRAIGHT_JOIN users_status ON leaderboard.id = users_status.id WHERE (users_status.banned < 1) ORDER BY pp_' + playmode + ' DESC, rankedscore_' + playmode + ' DESC')
  for (let i = 0; i < result.length; i++) {
    const element = result[i];
    if (element.id === userid)
      return [++i, element];
  }
  return false;
}

module.exports = {
  getuserid,
  getusername,
  checkAuth,
  checkLoggedIn,
  banUser,
  getuser,
  getLeaderBoard
};