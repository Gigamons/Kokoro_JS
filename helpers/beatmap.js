const Promise = require('bluebird');
const fs = require('fs');
const request = require('request');
const requestHelper = require('./requestHelper');
const APIHelper = require('./APIHelper');
const SQLString = require('sqlstring');

const config = require('../config');
const common = require('../common');
const url = require('url');
const redis = common.RedisManager;
const mysql = common.MySQLManager;
const rankedStatus = common.rankedStatus;
const builder = APIHelper.builder;
const OsuAPIUrl = 'https://osu.ppy.sh/api';

const key = config.osu.apikey;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// TODO: Rewrite this Whole file for new Database.


async function addmap(beatmapsetid = 0) {
  let uri = new url.URL('https://storage.gigamons.de/api/s/' + beatmapsetid);

  const response = await requestHelper.request_get(uri.toString());
  const j = JSON.parse(response.body);
  console.log(uri.toString());

  for (let i = 0; i < j.ChildrenBeatmaps.length; i++) {
    const beatmap = j.ChildrenBeatmaps[i];
    
    if(await beatmapExists(beatmap.BeatmapID, beatmap.FileMD5))
     continue;

    if(j.RankedStatus === rankedStatus.needupdate)
      j.RankedStatus = rankedStatus.ranked; 
    
    if(j.RankedStatus === rankedStatus.qualified)
      j.RankedStatus = rankedStatus.loved;


    await downloadMap(beatmap.BeatmapID);

    await mysql.query('INSERT INTO beatmaps_rating (beatmapMD5) VALUES (?) ', beatmap.FileMD5)

    await mysql.query(`
      INSERT INTO beatmaps (beatmapSetID, beatmapID, beatmapMD5, rankedStatus, rankedDate, artist, title, creator, lastUpdate, difficulty, cs, od, ar, hp, hitlength, source, genreid, totallength, version, playMode, tags, playcount, max_combo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);
    `, j.SetID, beatmap.BeatmapID, beatmap.FileMD5, j.RankedStatus, (new Date(j.ApprovedDate)).toISOString(), j.Artist, j.Title, j.Creator, (new Date(j.LastUpdate)).toISOString(), beatmap.DifficultyRating, beatmap.CS, beatmap.OD, beatmap.AR, beatmap.HP, beatmap.HitLength, j.Source, j.Genre, beatmap.TotalLength, beatmap.DiffName, beatmap.Mode, j.Tags, 0, (beatmap.MaxCombo || 0));
  }
  
}

async function isRanked(hash = '') {

}

async function beatmapInfo(beatmapmd5 = '') {
  return await mysql.query('SELECT * FROM beatmaps WHERE beatmapMD5 = ?', beatmapmd5);
}

async function hasBeatmapReply(score_hash) {

}

async function CheckScoreExists(score_hash = '') {

}

function getBeatmapData(beatmap = {}, totalScores = 0, scoreboardVersion = 4) {
  let status;
  if (scoreboardVersion < 4 && beatmap.rankedStatus === rankedStatus.loved)
    status = rankedStatus.qualified;
  else
    if (config.Kokoro.everythingisranked)
      status = rankedStatus.ranked;
    else status = beatmap.rankedStatus;

  let out = status + '|true'
  if (beatmap.rankedStatus != rankedStatus.not_submited && beatmap.rankedStatus != rankedStatus.needupdate && beatmap.rankedStatus != rankedStatus.unkown)
    out += '|' + beatmap.beatmapID + '|' + beatmap.beatmapSetID + '|' + totalScores + '\n' +
      '\n' +
      beatmap.title + '\n' +
      '\n';
  return out;
}

async function beatmapExists(bmid = 0, beatmaphash = '') {
  const result = await mysql.query("SELECT beatmapMD5 FROM beatmaps WHERE beatmapID = ?", bmid);
  for (let i = 0; i < result.length; i++) {
    const bm = result[i];

    if(bm.beatmapMD5 && beatmaphash)
      if(bm.beatmapMD5 !== beatmaphash) {
        let uri = new url.URL('https://osu.ppy.sh/api/get_beatmaps');
        uri.searchParams.set('k', config.osu.apikey);
        uri.searchParams.append('b', bmid);

        if(beatmap.approved === rankedStatus.needupdate)
          beatmap.approved = rankedStatus.ranked;
        
        const response = await requestHelper.request_get(uri.toString());
        const j = JSON.parse(response.body);
        const beatmap = j[0];
        await downloadMap(bmid);
        await mysql.query(`
          UPDATE beatmaps SET beatmapSetID = ? , beatmapID = ?, beatmapMD5 = ?, rankedStatus = ?, rankedDate = ?, artist = ?, title = ?, creator = ?, lastUpdate = ?, difficulty = ?, cs = ?, od = ?, ar = ?, hp = ?, hitlength = ?, source = ?, genreid = ?, totallength = ?, version = ?, playMode = ?, tags = ?, max_combo = ? WHERE beatmapID = ?;
        `, beatmap.beatmapset_id, beatmap.beatmap_id, beatmap.file_md5, beatmap.approved, (new Date(beatmap.approved_date)).toISOString(), beatmap.artist, beatmap.title, beatmap.creator, (new Date(beatmap.last_update)).toISOString(), beatmap.difficultyrating, beatmap.diff_size, beatmap.diff_overall, beatmap.diff_approach, beatmap.diff_drain, beatmap.hit_length, beatmap.source, beatmap.genre_id, beatmap.total_length, beatmap.version, beatmap.mode, beatmap.tags, (beatmap.max_combo || 0), bmid);
        await mysql.query('UPDATE beatmaps_rating SET beatmapMD5 = ?', beatmap.file_md5);
      }
    return true;
  }
  return false;
}

async function beatmapExistsHash(hash = '') {

}

async function getScoreboardRank(userid, beatmap_hash, relaxing = false) {

}

async function getScoreByScoreID(ScoreID) {

}

async function getScorebUserID(userid, beatmap_hash) {

}

async function downloadMap(bmid = 0) {
  if (!fs.existsSync('../files/osu/' + bmid + '.osu')) {
    await request('https://osu.ppy.sh/osu/' + bmid).pipe(fs.createWriteStream('./files/osu/' + bmid + '.osu'));
  } else {
    fs.unlinkSync('../files/osu/' + bmid + '.osu');
    await request('https://osu.ppy.sh/osu/' + bmid).pipe(fs.createWriteStream('./files/osu/' + bmid + '.osu'));
  }
}

module.exports = {
  addmap,
  beatmapInfo,
  hasBeatmapReply,
  getBeatmapData,
  isRanked,
  getScoreboardRank,
  getScoreByScoreID,
  getScorebUserID,
  CheckScoreExists,
  beatmapExists,
  beatmapExistsHash
}