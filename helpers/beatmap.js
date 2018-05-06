const
  common = require('../common'),
  request = require('./requestHelper'),
  url = require('url'),
  config = require('../config'),
  sqlstring = require('sqlstring'),
  rankedStatus = common.rankedStatus,
  mysql = common.MySQLManager;

class Beatmap {
  constructor(BeatmapID = 0, BeatmapMD5 = '') {
    this.beatmapID = BeatmapID || 0;
    this.beatmapSetID = 0;
    this.beatmapMD5 = BeatmapMD5 || '';
    this.rankedStatus = 0;
    this.rankedDate = new Date();
    this.artist = '';
    this.title = '';
    this.creator = '';
    this.lastUpdate = new Date();
    this.difficulty = 0.00;
    this.cs = 0.00;
    this.od = 0.00;
    this.ar = 0.00;
    this.hp = 0.00;
    this.bpm = 0;
    this.hitlength = 0;
    this.source = '';
    this.genreid = 0;
    this.totallength = 0;
    this.version = '';
    this.playMode = 0;
    this.tags = '';
    this.playcount = 0;
    this.max_combo = 0;
  }
  async _init() {
    if (!await this._beatmapExists())
      await this._addMap();
  }
  // FIXME: Rewrite to a nondirty way.
  async _beatmapExists() {
    try {
      const c = await mysql.query("SELECT * FROM beatmaps WHERE beatmapMD5 = ?", this.BeatmapMD5);
      c[0].beatmapMD5;
      return true;
    } catch (ex) {
      return false;
    }
  }
  async _setMap() {
    let b = '';
    let s = '';
    if (this.beatmapID > 0 && this.beatmapID)
      b = 'beatmapID',
      s = this.beatmapID;
    else if (this.beatmapSetID > 0 && this.beatmapSetID)
      b = 'beatmapSetID',
      s = this.beatmapID;
    else if (this.beatmapMD5 && this.beatmapMD5.length > 15)
      b = 'beatmapMD5',
      s = this.beatmapMD5;
    else
      throw 'invalid _setMap()';

    const m = await mysql.query("SELECT * FROM beatmaps WHERE " + b + " = ?", s);
    if (m && m.length > 0) {
      const bm = m[0];
      this.beatmapSetID = bm.beatmapSetID,
        this.beatmapID = bm.beatmapID,
        this.beatmapMD5 = bm.beatmapMD5,
        this.rankedStatus = bm.rankedStatus,
        this.rankedDate = new Date(bm.rankedDate),
        this.artist = bm.artist,
        this.title = bm.title,
        this.creator = bm.creator,
        this.lastUpdate = new Date(bm.lastUpdate),
        this.difficulty = bm.difficulty,
        this.cs = bm.cs,
        this.od = bm.od,
        this.ar = bm.ar,
        this.hp = bm.hp,
        this.bpm = bm.bpm,
        this.hitlength = bm.hitlength,
        this.source = bm.source,
        this.genreid = bm.genreid,
        this.totallength = bm.totallength,
        this.version = bm.version,
        this.playMode = bm.playMode,
        this.tags = bm.tags,
        this.playcount = bm.playcount,
        this.max_combo = bm.max_combo;
    } else if (m) {
      const bm = m;
      this.beatmapSetID = bm.beatmapSetID,
        this.beatmapID = bm.beatmapId,
        this.beatmapMD5 = bm.beatmapMD5,
        this.rankedStatus = bm.rankedStatus,
        this.rankedDate = new Date(bm.rankedDate),
        this.artist = bm.artist,
        this.title = bm.title,
        this.creator = bm.creator,
        this.lastUpdate = new Date(bm.lastUpdate),
        this.difficulty = bm.difficulty,
        this.cs = bm.cs,
        this.od = bm.od,
        this.ar = bm.ar,
        this.hp = bm.hp,
        this.bpm = bm.bpm,
        this.hitlength = bm.hitlength,
        this.source = bm.source,
        this.genreid = bm.genreid,
        this.totallength = bm.totallength,
        this.version = bm.version,
        this.playMode = bm.playMode,
        this.tags = bm.tags,
        this.playcount = bm.playcount,
        this.max_combo = bm.max_combo;
    }
  }
  async _setMapfromOsu() {
    const uri = new url.URL("https://osu.ppy.sh/api/get_beatmaps");
    if (this.beatmapID == undefined) return;
    uri.searchParams.set("k", config.osu.apikey);
    if (this.beatmapID > 0 && this.beatmapID)
      uri.searchParams.append("b", this.beatmapID);
    else if (this.beatmapSetID > 0 && this.beatmapSetID)
      uri.searchParams.append("s", this.beatmapSetID);
    else if (this.beatmapMD5 && this.beatmapMD5.length > 15)
      uri.searchParams.append("h", this.beatmapMD5);
    else
      throw 'invalid _setMapfromOsu()';

    const i = await request.request_get(uri.toString());
    let r = JSON.parse(i.body);

    if (r.approved === rankedStatus.needupdate)
      r.approved = rankedStatus.ranked;
    else if (r.approved === rankedStatus.qualified)
      r.approved = rankedStatus.loved;

    if (r.length > 0) {
      const bm = r[0];
      this.beatmapSetID = bm.beatmapset_id,
        this.beatmapID = bm.beatmap_id,
        this.beatmapMD5 = bm.file_md5,
        this.rankedStatus = bm.approved,
        this.rankedDate = new Date(bm.approved_date),
        this.artist = bm.artist,
        this.title = bm.title,
        this.creator = bm.creator,
        this.lastUpdate = new Date(bm.last_update),
        this.difficulty = bm.difficultyrating,
        this.cs = bm.diff_size,
        this.od = bm.diff_overall,
        this.ar = bm.diff_approach,
        this.hp = bm.diff_drain,
        this.bpm = bm.bpm,
        this.hitlength = bm.hit_length,
        this.source = bm.source,
        this.genreid = bm.genre_id,
        this.totallength = bm.total_length,
        this.version = bm.version,
        this.playMode = bm.mode,
        this.tags = bm.tags,
        this.playcount = 0,
        this.max_combo = bm.max_combo;
    }
  }
  // FIXME: Fix this and catch errors since i'm to lazy for this and i worked around... 5h on this and still can't fix it i'll do it later.
  async _addMap() {
    await this._setMapfromOsu();
    try {
      if (this.beatmapMD5 && this.beatmapMD5.length > 12) {
        if (!await this._beatmapExists())
          await mysql.query('INSERT INTO beatmaps (beatmapSetID, beatmapID, beatmapMD5, rankedStatus, rankedDate, artist, title, creator, lastUpdate, difficulty, cs, od, ar, hp, bpm, hitlength, source, genreid, totallength, version, playMode, tags, max_combo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', this.beatmapSetID, this.beatmapID, this.beatmapMD5, this.rankedStatus, this.rankedDate.toISOString(), this.artist, this.title, this.creator, this.lastUpdate.toISOString(), this.difficulty, this.cs, this.od, this.ar, this.hp, this.bpm, this.hitlength, this.source, this.genreid, this.totallength, this.version, this.playMode, this.tags, this.max_combo);
        return true;
      }
    } catch (ex) { }
    return false;
  }
  async toBeatmapHeader(scoreboardVersion = 0, totalScores = 0) {
    let status;
    if (scoreboardVersion < 4 && this.rankedStatus === rankedStatus.loved)
      status = rankedStatus.qualified;
    else
      status = this.rankedStatus || rankedStatus.latestpending;

    if (status === rankedStatus.needupdate)
      status = rankedStatus.ranked;
    else if (status === rankedStatus.qualified)
      status = rankedStatus.loved;

    let out = status + '|false';
    if (status !== rankedStatus.not_submited && status !== rankedStatus.needupdate && status !== rankedStatus.unkown) {
      out += '|' + (this.beatmapID || 0) + '|' + (this.beatmapSetID || 0) + '|' + totalScores + '\n';
      out += this.playcount + '\n';
      out += this.artist + ' - ' + this.title + ' [' + this.version + ']' + '\n' || '' + '\n';
      out += '10.0\n';
    }
    if(out.indexOf("undefined") > -1) {
      console.log(out);
      out = rankedStatus.not_submited + '|false';
    }
    return out;
  }
  async info() {
    await this._setMap();
    return {
      beatmapID: this.beatmapID,
      beatmapSetID: this.beatmapSetID,
      beatmapMD5: this.beatmapMD5,
      rankedStatus: this.rankedStatus,
      rankedDate: this.rankedDate,
      artist: this.artist,
      title: this.title,
      creator: this.creator,
      lastUpdate: this.lastUpdate,
      difficulty: this.difficulty,
      cs: this.cs,
      od: this.od,
      ar: this.ar,
      hp: this.hp,
      bpm: this.bpm,
      hitlength: this.hitlength,
      source: this.source,
      genreid: this.genreid,
      totallength: this.totallength,
      version: this.version,
      playMode: this.playMode,
      tags: this.tags,
      playcount: this.playcount,
      max_combo: this.max_combo
    }
  }
}

module.exports = Beatmap;