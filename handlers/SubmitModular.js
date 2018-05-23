// CryptoModules
const Rijndael = require("rijndael-js"),
  base64 = require('base64-js');

// SystemModules
const util = require('util'),
  fs = require('fs');

// CommonModules
const router = require('express').Router(),
  common = require('../common'),
  mods = common.Mods.modConst,
  modHelper = common.Mods.getMods,
  playModes = common.playModes,
  rankedStatus = common.rankedStatus,
  mysql = common.MySQLManager,
  usertools = common.UserTools,
  Beatmap = require('../helpers/beatmap'),
  leaderboardCalc = require('./leaderboardcalc'),
  config = require('../config'),
  lzma = require('lzma-native'),
  eventtool = common.EventTool,
  crypto = common.Crypto,
  timehelper = require('../helpers/time'),
  modhelper = common.Mods;
// PP
const PPCalculator = require('../pp');

function decryptdata(scoreenc, iv, osuver) {
  let key;
  if (osuver != null && osuver != undefined)
    key = 'osu!-scoreburgr---------' + osuver;
  else
    key = 'h89f2-890h2h89b34g-h80g134n90133';
  // 

  const s = base64.toByteArray(String(scoreenc)),
    i = base64.toByteArray(String(iv)),
    cipher = new Rijndael(key, "cbc"),
    scoreData = cipher.decrypt(s, 256, i).toString().split(":");

  return {
    beatmapMD5: String(scoreData[0]),
    username: String(scoreData[1].trim()),
    scoreMD5: String(scoreData[2]),
    count300: Number(scoreData[3]),
    count100: Number(scoreData[4]),
    count50: Number(scoreData[5]),
    countGeki: Number(scoreData[6]),
    countKatu: Number(scoreData[7]),
    countMiss: Number(scoreData[8]),
    score: Number(scoreData[9]),
    maxCombo: Number(scoreData[10]),
    perfect: Boolean(scoreData[11] === "True"),
    ArchivedLetter: String(scoreData[12]),
    mods: Number(scoreData[13]),
    pass: Boolean(scoreData[14] === "True"),
    playMode: Number(scoreData[15]),
    localDate: Number(scoreData[16]),
    serverDate: PythonTime(),
    rawVersion: String(scoreData[17]),
    badFlags: (length(String(scoreData[17])) - length(String(scoreData[17]).trim())) & ~4
  };
}

function decryptsecurityInfo(securityHash, iv, osuver) {
  let key;
  if (osuver != null && osuver != undefined)
    key = 'osu!-scoreburgr---------' + osuver;
  else
    key = 'h89f2-890h2h89b34g-h80g134n90133';
  // 

  const s = base64.toByteArray(String(securityHash)),
    i = base64.toByteArray(String(iv)),
    cipher = new Rijndael(key, "cbc"),
    securityInfo = cipher.decrypt(s, 256, i).toString().trim(),
    securityInfoParts = securityInfo.split(":");

  if(securityInfoParts && securityInfoParts.length && securityInfoParts.length < 4)
    return undefined;
  else if(!securityInfoParts || !securityInfo)
    return undefined;
  
  return {
    osuMD5: String(securityInfoParts[0]),
    macAddressList: String(securityInfoParts[1]),
    macAddressMD5: String(securityInfoParts[2]),
    uniqueMD5: String(securityInfoParts[3]),
    diskMD5: String(securityInfoParts[4]) || '',
    securityInfo
  }
}

function length(string = '') {
  return string.length
}
function trim(string = '') {
  return string.trim();
}

function forbiddenmodcombo(modSTRING) {
  if ((modSTRING.includes('EZ') && modSTRING.includes('HR'))
    || (modSTRING.includes('DT') && modSTRING.includes('HT'))
    || (modSTRING.includes('HT') && modSTRING.includes('NC'))
    || (modSTRING.includes('RX') && modSTRING.includes('AP'))
    || (modSTRING.includes('NF') && modSTRING.includes('SD'))
    || (modSTRING.includes('DT') && modSTRING.includes('NC'))
    || (modSTRING.includes('SD') && modSTRING.includes('PF'))
    || (modSTRING.includes('NF') && modSTRING.includes('RX'))
    || (modSTRING.includes('NF') && modSTRING.includes('AP'))
    || (modSTRING.includes('SD') && modSTRING.includes('RX'))
    || (modSTRING.includes('PF') && modSTRING.includes('RX'))
    || (modSTRING.includes('SD') && modSTRING.includes('AP'))
    || (modSTRING.includes('PF') && modSTRING.includes('AP'))
    || (modSTRING.includes('RX') && modSTRING.includes('AT'))
    || (modSTRING.includes('AT') && modSTRING.includes('SO'))
  ) return true;
  else return false;
}

function length(string) {
  return new Buffer(String(string)).byteLength;
}

function PythonTime() {
  let currentdate = new Date().valueOf();
  let date = String(currentdate);
  let pythontime = Number(date.substring(0, (length(date) - 3)))
  return pythontime;
}

router.use(async (req, res) => {
  const body = req.body,
    file = req.file,
    scoreData = decryptdata(body.score, body.iv, body.osuver),
    securityHash = decryptsecurityInfo(body.s, body.iv, body.osuver),
    password = body.pass,
    beatmap = new Beatmap(0, scoreData.beatmapMD5);

  const userid = await usertools.getuserid(scoreData.username);
  if(userid < 1 || !userid) {
    console.log("error: unknown");
    res.end("error: unknown");
    return;
  }
  if(!await usertools.checkLoggedIn(userid)) {
    console.log("error: pass");
    res.end("error: pass");
    return;
  }

  await beatmap._init();
  await beatmap.info();

  if(!scoreData) {
    console.log("error: missingData");
    res.end("error: missinginfo");
    return;
  } else if(!securityHash) {
    console.log("error: securityHash");
    res.end("error: missinginfo");
    return;
  }

  const ScoreHash = crypto.md5String(util.format("%d%d%d%d%d%s%d%s%s%d%s%d%s%d%s", scoreData.count100 + scoreData.count300, scoreData.count50, scoreData.countGeki, scoreData.countKatu, scoreData.countMiss, scoreData.beatmapMD5, scoreData.maxCombo, scoreData.perfect ? 'True':'False', scoreData.username, scoreData.score, scoreData.ArchivedLetter, scoreData.mods, scoreData.pass ? 'True':'False', scoreData.playMode, scoreData.rawVersion));

  if((await mysql.query('SELECT count(score_hash) FROM scores WHERE score_hash = ?', ScoreHash))[0]['count(score_hash)'] > 0) {
    console.log("error: dup");
    res.end("error: dup");
    return;
  }

  if(!beatmap.beatmapID || beatmap.beatmapID === 0 || beatmap.beatmapID.length) {
    console.log("error: beatmap");
    res.end("error: beatmap");
    return;
  }

  await increaseTotalScore(userid, scoreData.playMode, (scoreData.mods & common.Mods.modConst.Relax > 0 || scoreData.mods & common.Mods.modConst.Relax2 > 0), scoreData.score);
  await increasePlayCount(beatmap.beatmapID, userid, scoreData.playMode, (scoreData.mods & common.Mods.modConst.Relax > 0 || scoreData.mods & common.Mods.modConst.Relax2 > 0));

  if(beatmap.rankedStatus === rankedStatus.not_submited || beatmap.rankedStatus === rankedStatus.latestpending || beatmap.rankedStatus === rankedStatus.unkown) {
    console.log("error: beatmap");
    res.end("error: beatmap");
    return;
  }

  const lzmaReplay = fs.readFileSync(file.path);
  const lzmaReplayMD5 = crypto.md5File(lzmaReplay)
  if(file.size > 0 && scoreData.pass) {
    await mysql.query('INSERT INTO replays (score_hash, replay_hash, replay) VALUES (?, ?, ?)', ScoreHash, lzmaReplayMD5, lzmaReplay.toString('HEX'));
    fs.unlinkSync(file.path);
  } else {
    fs.unlinkSync(file.path);
  }

  if(!scoreData.pass) {
    await eventtool.WriteEvent({UserID: userid, Forced: true, relaxing: (scoreData.mods & common.Mods.modConst.Relax > 0 || scoreData.mods & common.Mods.modConst.Relax2 > 0)})
    res.end('ok');
    return;
  }

  let pp = 0;

  await mysql.query('INSERT INTO scores (userid, beatmap_hash, score_hash, replay_hash, score, combo, playmode, mods, count_300, count_100, count_50, count_miss, count_geki, count_katu, date, accuracy, pp) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', userid, beatmap.beatmapMD5, ScoreHash, lzmaReplayMD5, scoreData.score, scoreData.maxCombo, scoreData.playMode, scoreData.mods, scoreData.count300, scoreData.count100, scoreData.count50, scoreData.countMiss, scoreData.countGeki, scoreData.countKatu, scoreData.serverDate, PPCalculator.calcacc(scoreData.count300, scoreData.count100, scoreData.count50, scoreData.countMiss, scoreData.countKatu, scoreData.countGeki, scoreData.playMode), pp);

  let output = [];
  output.push({
    type: 'beatmapId',
    value: beatmap.beatmapID
  });
  output.push({
    type: 'beatmapSetId',
    value: beatmap.beatmapSetID
  });
  output.push({
    type: 'beatmapPlaycount',
    value: await getplayCount(beatmap.beatmapID)
  });
  output.push({
    type: 'beatmapPasscount',
    value: await getPassCount(beatmap.beatmapMD5)
  });
  output.push({
    type: 'approvedDate',
    value: beatmap.rankedDate.toISOString().replace(/T/, ' ').replace(/\..+/, '')
  });
  output.push({
    type: 'chartId',
    value: 'overall'
  });
  output.push({
    type: 'chartName',
    value: 'Overall Ranking'
  });
  output.push({
    type: 'chartEndDate',
    value: ''
  });
  console.log("ok");
  res.end("ok");
  getCurrentPlace(beatmap.beatmapMD5, ScoreHash);
  // output.push({
  //   type: 'beatmapRankingBefore',
  //   value: 
  // });
  // output.push({
  //   type: 'beatmapRankingAfter',
  //   value: 
  // });
  // output.push({
  //   type: 'rankedScoreBefore',
  //   value: 
  // });
  // output.push({
  //   type: 'rankedScoreAfter',
  //   value: 
  // });
  // output.push({
  //   type: 'totalScoreBefore',
  //   value: 
  // });
  // output.push({
  //   type: 'totalScoreAfter',
  //   value: 
  // });
  // output.push({
  //   type: 'playCountBefore',
  //   value: 
  // });
  // output.push({
  //   type: 'accuracyBefore',
  //   value: 
  // });
  // output.push({
  //   type: 'accuracyAfter',
  //   value: 
  // });
  // output.push({
  //   type: 'rankBefore',
  //   value: 
  // });
  // output.push({
  //   type: 'rankAfter',
  //   value: 
  // });
  // output.push({
  //   type: 'toNextRank',
  //   value: 
  // });
  // output.push({
  //   type: 'toNextRankUser',
  //   value: 
  // });
  // output.push({
  //   type: 'achievements',
  //   value: 
  // });
  // output.push({
  //   type: 'achievements-new',
  //   value: 
  // });
  // output.push({
  //   type: 'onlineScoreId',
  //   value: 
  // });
});

function archivementMaker(Object = { Badge: 'all-secret-jackpot', Title: 'Mmmmnhh ... <3', Description: 'Do you wanna see my PP ? ( ͡° ͜ʖ ͡°)' }) {
  return Object.Badge + '+' + Object.Title + '+' + Object.Description;
}

async function getplayCount(beatmapID = 0) {
  return await mysql.query('SELECT playcount FROM beatmaps WHERE beatmapID = ?', beatmapID)[0]
}

async function getPassCount(beatmap_hash = '') {
  const t =  await mysql.query('SELECT count(*) FROM scores WHERE beatmap_hash = ?', beatmap_hash);
  return t[0]['count(*)']
}

async function getScoreID(beatmapID = 0) {

}

async function getCurrentPlace(beatmaphash = '', scoreHash = '') {

}

async function gotfirstPlace(beatmaphash = '', score_hash = '') {
  let result = await mysql.query('SELECT * FROM scores WHERE beatmap_md5=? ORDER BY score DESC LIMIT 1', [beatmaphash]);
  if (result[0].score_hash == score_hash) return true;
  else return false;
}

async function increasePlayCount(beatmapID = 0, userid = 0, playMode = 0, relaxing = false) {
  let p = 'osu';
  let c = '';
  if(relaxing)
    c = '_rx'
  if(playMode === playModes.osu)
    p = 'std';
  else if (playMode === playModes.taiko)
    p = 'taiko'
  else if (playMode === playModes.ctb)
    p = 'ctb'
  else if (playMode === playModes.mania)
    p = 'mania';
  else
    return;

  await mysql.query('UPDATE beatmaps SET playcount = playcount + 1 WHERE beatmapID = ?', beatmapID);
  await mysql.query('UPDATE leaderboard' +c+ ' SET playcount_'+p+' = (playcount_' + p +' + 1) WHERE id = ?', userid);
}
async function increaseTotalScore(userid = 0, playMode = 0, relaxing = false, Score = 0) {
  let p = 'osu';
  let c = '';
  if(relaxing)
    c = '_rx'
  if(playMode === playModes.osu)
    p = 'std';
  else if (playMode === playModes.taiko)
    p = 'taiko'
  else if (playMode === playModes.ctb)
    p = 'ctb'
  else if (playMode === playModes.mania)
    p = 'mania';
  else
    return;

  await mysql.query('UPDATE leaderboard' +c+ ' SET totalscore_'+p+' = (totalscore_' + p +' + ?) WHERE id = ?', Score, userid);
}

module.exports = router;
