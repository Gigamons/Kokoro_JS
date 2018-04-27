const Promise = require('bluebird');
const fs = require('fs');
const request = require('request');
const requestHelper = require('./requestHelper');
const APIHelper = require('./APIHelper');
const SQLString = require('sqlstring');

const config = require('../config');
const common = require('../common');

const redis = common.RedisManager;
const mysql = common.MySQLManager;
const rankedStatus = common.rankedStatus;
const builder = APIHelper.builder;
const OsuAPIUrl = 'https://osu.ppy.sh/api';

const key = config.osu.apikey;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// TODO: Rewrite this Whole file for new Database.


async function addmap(beatmapsetid = 0, beatmapid = 0) {
    let bmapi;
    if(beatmapsetid > 0){
        bmapi = builder(OsuAPIUrl, '/get_beatmaps', ['s'], [beatmapsetid], key);
    } else if(beatmapid > 0){
        bmapi = builder(OsuAPIUrl, '/get_beatmaps', ['b'], [beatmapsetid], key);
    } else {
        bmapi = builder(OsuAPIUrl, '/get_beatmaps', ['b'], [beatmapid], key);
    }
    let body = "";
    let j = [];
    try {
        body = (await requestHelper.request_get(bmapi)).body
        if(!body) body = '[]';
        j = JSON.parse(body);
    } catch(ex){
        body = '[]';
        j = [];
    }
    

    for (let i = 0; i < j.length; i++) {
        const element = j[i];
        let bmexists = false;
        try {
            bmexists = await beatmapExists(Number(element.beatmap_id));
        } catch (ex) {console.log(ex);bmexists = true;}
            
        
        if(!bmexists){
            await downloadMap(Number(element.beatmap_id));
            const e = {
                beatmap_id: Number(element.beatmap_id),
                beatmapset_id: Number(element.beatmapset_id),
                beatmap_hash: String(element.file_md5),
                song_name: String(element.artist+" - " + element.title+" ["+element.version+"]"),
                ar: Number(element.diff_approach),
                hp: Number(element.diff_drain),
                od: Number(element.diff_overall),
                cs: Number(element.diff_size), 
                star: Number(element.difficultyrating),
                max_combo: Number(element.max_combo), 
                hit_length: Number(element.hit_length), 
                bpm: Number(element.bpm),
                ranked: Number(0),
                mode: Number(element.mode),
                playcount: Number(0), 
                passcount: Number(0)
            }
            await mysql.query('INSERT INTO beatmaps (beatmap_id, beatmapset_id, beatmap_hash, song_name, ar, hp, od, cs, star, max_combo, hit_length, bpm, ranked, mode, playcount, passcount, oldid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [e.beatmap_id, e.beatmapset_id, e.beatmap_hash, e.song_name, e.ar, e.hp, e.od, e.cs, e.star, e.max_combo, e.hit_length, e.bpm, e.ranked, e.mode, e.playcount, e.passcount, 0]);
        } else {
            await downloadMap(Number(element.beatmap_id));
            const e = {
                beatmap_id: Number(element.beatmap_id),
                beatmapset_id: Number(element.beatmapset_id),
                beatmap_hash: String(element.file_md5),
                song_name: String(element.artist+" - " + element.title+" ["+element.version+"]"),
                ar: Number(element.diff_approach),
                hp: Number(element.diff_drain),
                od: Number(element.diff_overall),
                cs: Number(element.diff_size), 
                star: Number(element.difficultyrating),
                max_combo: Number(element.max_combo), 
                hit_length: Number(element.hit_length), 
                bpm: Number(element.bpm),
                ranked: Number(0),
                mode: Number(element.mode),
                playcount: Number(0), 
                passcount: Number(0)
            }
            await mysql.query('UPDATE beatmaps SET beatmap_id = ?, beatmapset_id = ?, beatmap_hash = ?, song_name = ?, ar = ?, hp = ?, od = ?, cs = ?, star = ?, max_combo = ?, hit_length = ?, bpm = ?, mode = ?, oldid = 0 WHERE beatmap_id = ?', [e.beatmap_id, e.beatmapset_id, e.beatmap_hash, e.song_name, e.ar, e.hp, e.od, e.cs, e.star, e.max_combo, e.hit_length, e.bpm, e.mode, e.beatmap_id])
        }
    }
    return;
}

async function isRanked(hash = '') {
    if(config.Kokoro.everythingisranked) return true;
    let result = await mysql.query('SELECT * FROM beatmaps WHERE beatmap_hash=?', [hash]);
    let status = Number(result[0].ranked);
    if(status === rankedStatus.ranked || status === rankedStatus.approved)
        return true;
    else return false;
}

async function beatmapInfo(beatmapmd5 = '') {
    const result = await mysql.query('SELECT * FROM beatmaps WHERE beatmap_hash=?', [beatmapmd5]);
    const q = result[0];
    if(q){
        return {
            beatmap_id: q.beatmap_id,
            beatmapset_id: q.beatmapset_id,
            beatmap_hash: q.beatmap_hash,
            song_name: q.song_name,
            ar: q.ar,
            hp: q.hp,
            od: q.od,
            cs: q.cs,
            star: q.star,
            max_combo: q.max_combo,
            hit_length: q.hit_length,
            bpm: q.bpm,
            ranked: q.ranked,
            mode: q.mode,
            playcount: q.playcount,
            passcount: q.passcount
        };
    } else return false;
}

async function hasBeatmapReply(score_hash) {
    let result = await mysql.query('SELECT * FROM scores WHERE score_hash = ?', [score_hash]);
    for (let i = 0; i < result.length; i++) {
        const element = result[i];
        if(element.replay_hash.length > 2)
            return true;
    }
    return false;
}

async function CheckScoreExists(score_hash = '') {
    let result = await mysql.query('SELECT * FROM scores WHERE score_hash = ?', [score_hash]);
    for (let i = 0; i < result.length; i++) {
        const element = result[i];
        if(element.score_hash == score_hash) return true;
    }
    return false;
}

function getBeatmapData(beatmap = {}, totalScores = 0, scoreboardVersion = 4) {
    let status;
    if(scoreboardVersion < 4 && beatmap.ranked === rankedStatus.loved)
        status = rankedStatus.qualified;
    else
        if(config.Kokoro.everythingisranked)
            status = rankedStatus.ranked;
        else status = beatmap.ranked
    
    let out = status+'|false'
    if(beatmap.ranked != rankedStatus.not_submited && beatmap.ranked != rankedStatus.needupdate && beatmap.ranked != rankedStatus.unkown)
        out += '|'+beatmap.beatmap_id+'|'+beatmap.beatmapset_id+'|'+totalScores+'\n'+
        '\n'+
        beatmap.song_name+'\n'+
        '\n';
    return out;
}

async function beatmapExists(bmid = 0) {
    return new Promise( async (resolve, reject) => {
        try {
            let result = await mysql.query('SELECT * FROM beatmaps WHERE beatmap_id=?', [bmid]);
            if(result.length > 0) resolve(true);
            else resolve(false);
        } catch (ex){
            reject(ex);
        }
    });
}

async function beatmapExistsHash(hash = '') {
    return new Promise( async (resolve, reject) => {
        try {
            let result = await mysql.query('SELECT * FROM beatmaps WHERE beatmap_hash=?', [hash]);
            if(result.length > 0) resolve(true);
            else resolve(false);
        } catch (ex){
            reject(ex);
        }
    });
}

async function getScoreboardRank(userid, beatmap_hash, relaxing = false){
    let select = 'SELECT userid FROM scores WHERE beatmap_md5 = ? ';
    select += 'AND completeStatus = 2 ';
    if(relaxing){
        select += 'AND (scores.mods & 128 > 0 OR scores.mods & 8192 > 0) ';
    } else {
        select += 'AND (scores.mods & 128 < 1 AND scores.mods & 8192 < 1) ';
    }
    select += 'ORDER BY score DESC';

    let scores = await mysql.query(''+select, [beatmap_hash]);
    for (let i = 0; i < scores.length; i++) {
        const element = scores[i];
        if(element.userid == userid)
            return i;
    }
    return 0;
}

async function getScoreByScoreID(ScoreID) {
    let result = await mysql.query('SELECT * FROM scores STRAIGHT_JOIN users ON scores.userid = users.id WHERE scoreid = ?', [ScoreID]);
    return result[0];
}

async function getScorebUserID(userid, beatmap_hash){
    let scores = await mysql.query('SELECT * FROM scores WHERE beatmap_md5 = ? ORDER BY score DESC LIMIT 1', [beatmap_hash]);
    for (let i = 0; i < scores.length; i++) {
        const q = scores[i];
        if(q.userid == userid)
            return {
                i,
                id: q.id,
                beatmap_md5: q.beatmap_md5,
                score_hash: q.score_hash,
                userid: q.userid,
                score: q.score,
                max_combo: q.max_combo,
                full_combo: q.full_combo,
                mods: q.mods,
                three: q.three,
                hundred: q.hundred,
                five: q.five,
                katus: q.katus,
                gekis: q.gekis,
                misses: q.misses,
                time: q.time,
                play_mode: q.play_mode,
                completeStatus: q.completeStatus,
                accuracy: q.accuracy,
                pp: q.pp
            }
    }
    return 0;
}

async function downloadMap(bmid = 0) {
    if (!fs.existsSync('../files/osu/'+bmid+'.osu')) {
        await request('https://osu.ppy.sh/osu/'+bmid).pipe(fs.createWriteStream('./files/osu/'+bmid+'.osu'));
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