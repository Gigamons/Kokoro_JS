const common = require('../common');
const Beatmap = require('../helpers/beatmap');
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
    this.beatmap = new Beatmap(0, this.beatmapHash);
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
    await this.beatmap._init();
    let bm;
    try {
      bm = await this.beatmap.info();
    } catch (ex) {
      console.error(ex);
      bm = {
        rankedStatus: RankedStatus.not_submited,
        beatmapID: 0,
        beatmapSetID: 0
      }
    }

    if(bm.beatmapID === 0) {
      try {
        await this.beatmap._setMapfromOsu();
        bm = await this.beatmap.info();
      } catch (ex) {
        console.error(ex);
        bm = {
          rankedStatus: RankedStatus.latestpending,
          beatmapID: 0,
          beatmapSetID: 0
        }
      }
    }

    // We don't need unessecery query's if ranked status is not loved/ranked/approved/qualified.
    if(bm.rankedStatus != RankedStatus.not_submited && bm.rankedStatus != RankedStatus.needupdate && bm.rankedStatus != RankedStatus.unkown) {
      await this.Friends();
      await this.Country();
      await this.Scores();
      await this.getPersonalBest();
    }

    let outputString = '';
    outputString += await this.beatmap.toBeatmapHeader(this.sb_version, await this.totalScores())

    for (let i = 0; i < 51; i++) {
      const score = this.scores[i];
      if(score && score[i]){
        outputString += score.id + '|';
        outputString += UserTools.getusername(score.userid) + '|';
        outputString += score.score + '|';
        outputString += score.combo + '|';
        outputString += score.count_50 + '|';
        outputString += score.count_100 + '|';
        outputString += score.count_300 + '|';
        outputString += score.count_miss + '|';
        outputString += score.count_katu + '|';
        outputString += score.count_geki + '|';
        outputString += Number(score.count_100 < 1 && score.count_50 < 0 && score.count_miss < 0) + '|';
        outputString += score.mods + '|';
        outputString += score.userid + '|';
        outputString += (score.pos + 1) + '|';
        outputString += 0 + '|';
        outputString += 0;
      }
      outputString += '\n';
    }
    return outputString;
  }

}

async function scoreboard(query, ip, req) {
  try {
    const Beatmap_Checksumm = query.c;
    const Beatmap_Filename = query.f;
    const beatmapsetId = query.i;

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

    if (query.a !== 0 && query.a !== "0") {  }

    const s = new sb(query.mods, userid, Scoreboard_Version, Scoreboard_Type, Beatmap_Checksumm, playMode);

    return await s.getScoreboardData();
  } catch (ex) {
    console.error(ex)
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
