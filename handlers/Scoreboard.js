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
  constructor(mods, userid, sb_version, sb_type) {
    this.userid = Number(userid);
    this.sb_version = Number(sb_version);
    this.mods = Number(mods);
    this.sb_type = {
      normal: (sb_type === 1 || sb_type === "1"),
      mods: (sb_type === 2 || sb_type === "2"),
      friends: (sb_type === 3 || sb_type === "3"),
      country: (sb_type === 4 || sb_type === "4")
    };
    this.scores = []
    this.friendlist = [];
  }

  async Friends() {
    this.friendlist = await mysql.query('SELECT friendid FROM friends WHERE userid = ?', this.userid);
  }

  async Country() {
    this.country = await mysql.query('SELECT country FROM users_status WHERE id = ?', this.userid);
  }

  async Scores() {
    let q = format('SELECT * FROM scores friends WHERE scores.passed = 1 AND scores.userid != ?', [this.userid]);

    if(this.sb_type.friends) {
      q += ", scores.userid = friends.friendid"
    }
    
    if (this.sb_type.mods) {
      q += format(', mods = ?', [this.mods])
    }
    if (this.mods & ModHelper.modConst.Relax || this.mods & ModHelper.modConst.Relax2)

    if (this.sb_type.country) {
      
    }
    console.log(this.country);
    console.log(q);

    this.scores = await mysql.query(q)
  }

  async getScoreboardData() {
    await this.Friends();
    await this.Country();
    await this.Scores();

    return "";
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
    if(!userid)
      throw 'pass';

    if(!await UserTools.checkLoggedIn(userid, Password_Hash))
      throw 'pass';

    if(query.a !== 0 && query.a !== "0"){ await UserTools.banUser(userid, "Detected some kind of Hacks"); throw 'hax'; }

    const s = new sb(query.mods, userid, Scoreboard_Version, Scoreboard_Type);

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
