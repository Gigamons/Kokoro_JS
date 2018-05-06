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
    let q = format("SELECT scoreid, MAX(score) FROM scores STRAIGHT_JOIN users ON scores.userid = users.id STRAIGHT_JOIN users_status ON users.id = users_status.id WHERE scores.beatmap_hash = ? AND scores.playmode = ? AND (users_status.banned < 1 OR users.id = ?) ", [this.beatmapHash, this.playMode, this.userid]);

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

    q += "GROUP BY userid ORDER BY max(score) DESC LIMIT 100"

    const s = await mysql.query(q);
    console.dir(q);
    for (let i = 0; i < s.length; i++) {
      const score = s[i];
      this.scores.push(await this.getScorebyID(score.scoreid + 1) || await this.getScorebyID(score.scoreid))
    }
  }

  async totalScores() {
    return (mysql.query('SELECT * FROM scores WHERE beatmap_hash = ?', this.beatmapHash)).length;
  }

  async getPersonalBest() {
    let q = format('SELECT * FROM scores WHERE userid = ? AND beatmap_hash = ? AND playmode = ? ', [this.userid, this.beatmapHash, this.playMode]);

    if (this.mods & ModHelper.modConst.Relax > 0|| this.mods & ModHelper.modConst.Relax2 > 0) {
      q += format("AND (mods & 128 > 0 OR mods & 8192 > 0) ")
    }
    q += ' ORDER BY score DESC LIMIT 1';
    this.scores.push((await mysql.query(q))[0]);
  }

  async scoreboardPosition() {
    // https://stackoverflow.com/questions/3490682/how-to-get-the-position-of-sorted-rows-using-mysql-and-php
    let q = format("SELECT *, (SELECT COUNT(1) AS num FROM scores WHERE scores.score > s1.score AND beatmap_hash = ?) + 1 AS rank FROM scores AS s1 WHERE beatmap_hash = ? ORDER BY rank asc", [this.beatmapHash, this.beatmapHash]);
    return (await mysql.query(q))[0].rank;
  }
  
  async getScorebyID(scoreid = 0) {
    const q = format("SELECT * FROM scores WHERE scoreid=?", scoreid)
    return (await mysql.query(q))[0];
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
    if(bm.rankedStatus != RankedStatus.not_submited && bm.rankedStatus != RankedStatus.unkown) {
      await this.Friends();
      await this.Country();
      await this.getPersonalBest();
      await this.Scores();
    }

    let outputString = '';
    outputString += await this.beatmap.toBeatmapHeader(this.sb_version, await this.totalScores())
    
    for (let i = 0; i < this.scores.length; i++) {
      const score = this.scores[i];
      if(score){
        outputString += score.scoreid + '|';
        outputString += (await UserTools.getusername(score.userid)).username + '|';
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
        outputString += (i !== 0 ? i : await this.scoreboardPosition()) + '|';
        outputString += score.date + '|';
        outputString += score.replay_hash ? 1 : 0;
      }
      outputString += '\n';
    }
    console.dir(outputString);
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
