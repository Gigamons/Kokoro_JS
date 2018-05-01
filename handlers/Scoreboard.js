const common = require('../common');
const beatmapHelper = require('../helpers/beatmap');
const exceptions = require('../helpers/exceptions');
const TimeHelper = require('../helpers/time');
const { format } = require('sqlstring');

const redis = common.RedisManager;
const mysql = common.MySQLManager;
const UserTools = common.UserTools;

const RankedStatus = common.rankedStatus;
const ModHelper = common.Mods;
const CountryHelper = common.countryHelper;
const IPHelper = common.ipHelper;

const addMap = beatmapHelper.addmap;
const getScoreboardData = beatmapHelper.getScoreboardData;
const beatmapExistsHash = beatmapHelper.beatmapExistsHash;

let cachedscoreboards = [];
// Todo: Finish that.
class sb {
  constructor(mods, userid, sb_version, sb_type, beatmapHash, playMode) {
    this.userid = Number(userid);
    this.sb_version = Number(sb_version);
    this.mods = Number(mods);
    this.beatmapHash = beatmapHash;
    this.playMode = Number(playMode);
    this.sb_type = {
      normal: (sb_type === 1 || sb_type === "1"),
      mods: (sb_type === 2 || sb_type === "2"),
      friends: (sb_type === 3 || sb_type === "3"),
      country: (sb_type === 4 || sb_type === "4")
    };
    this.scores = []
    this.personalBest = [];
    this.friendlist = [];
  }

  async Friends() {
    this.friendlist = await mysql.query('SELECT friendid FROM friends WHERE userid = ?', this.userid);
  }

  async Country() {
    this.country = await mysql.query('SELECT country FROM users_status WHERE id = ?', this.userid);
  }

  async Scores() {
    let q = format("SELECT * FROM scores STRAIGHT_JOIN users ON scores.userid = users.id STRAIGHT_JOIN users_status ON users.id = users_status.id WHERE scores.beatmap_hash = ? AND scores.playmode = ? AND scores.passed = 1 AND (users_status.banned < 1 OR users.id = ?) ", [this.beatmapHash, this.playMode, this.userid]);

    if (this.sb_type.country) {
      q += format("AND users_status.country = (SELECT country FROM users_status WHERE id = ? LIMIT 1) ", [this.userid])
    }

    if (this.sb_type.mods) {
      q += format("AND scores.mods = ? ", [this.mods])
    }

    if (this.sb_type.friends) {
      q += format("AND (scores.userid IN (SELECT friendid FROM friends WHERE userid = ?) OR scores.userid = ?) ", [this.userid, this.userid])
    }

    if (this.mods & ModHelper.modConst.Relax || this.mods & ModHelper.modConst.Relax2) {
      q += format("AND (scores.mods & 128 > 0 OR scores.mods & 8192 > 0) ")
    }

    q += "ORDER BY score DESC LIMIT 100"

    this.scores = await mysql.query(q)
  }

  async totalScores() {
    return (mysql.query('SELECT * FROM scores WHERE beatmap_hash = ? AND passed = 1', this.beatmapHash)).length;
  }

  async getPersonalBest() {
    let q = format('SELECT id FROM scores WHERE userid = ? AND beatmap_hash = ? AND playmode = ? AND passed = 1 ', [this.userid, this.b, this.beatmapHash, this.playMode]);

    if (this.sb_type.friends) {
      q += format("AND (scores.userid IN (SELECT friendid FROM friends WHERE userid = ?) OR scores.userid = ?) ", [this.userid, this.userid])
    }

    if (this.sb_type.mods) {
      q += format("AND mods = ? ", [this.mods]);
    }

    if (this.mods & ModHelper.modConst.Relax || this.mods & ModHelper.modConst.Relax2) {
      q += format("AND (mods & 128 > 0 OR mods & 8192 > 0) ")
    }
    this.personalBest = await mysql.query(q)
  }

  async getScoreboardData() {
    let bm = await beatmapHelper.beatmapInfo(this.beatmapHash);
    
    if(bm.length < 1){
      bm[0].rankedStatus = RankedStatus.not_submited;
      bm[0].beatmapID = 0;
      bm[0].beatmapSetID = 0;
    }

    // We don't need unessecery query's if ranked status is not loved/ranked/approved/qualified.
    if(bm[0].rankedStatus != RankedStatus.not_submited && bm[0].rankedStatus != RankedStatus.needupdate && bm[0].rankedStatus != RankedStatus.unkown) {
      await this.Friends();
      await this.Country();
      await this.Scores();
      await this.getPersonalBest();
    }

    let outputString = '';
    outputString += beatmapHelper.getBeatmapData(bm[0], await this.totalScores(), this.sb_version);


    return outputString;
  }

}

async function scoreboard(query, ip, req) {
  try {
    const Beatmap_Checksumm = query.c;
    const Beatmap_Filename = query.f;
    const beatmapsetId = query.i;

    await addMap(beatmapsetId);

    const playMode = query.m;
    const Scoreboard_Type = query.v;
    const Scoreboard_Version = query.vv;

    const Username = query.us;
    const Password_Hash = query.ha;

    const userid = await UserTools.getuserid(Username);
    if (!userid)
      throw 'pass';

    if (!await UserTools.checkLoggedIn(userid, Password_Hash))
      throw 'pass';

    if (query.a !== 0 && query.a !== "0") { await UserTools.banUser(userid, "Detected some kind of Hacks"); throw 'hax'; }

    const s = new sb(query.mods, userid, Scoreboard_Version, Scoreboard_Type, Beatmap_Checksumm, playMode);

    return await s.getScoreboardData();
  } catch (ex) {
    console.log(ex)
    switch (ex) {
      case 'pass':
        break;

      default:
        console.error(ex);
        break;
    }
  }
}

module.exports = scoreboard;
