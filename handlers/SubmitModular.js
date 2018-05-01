// CryptoModules
const Rijndael = require("rijndael-js");
const base64 = require('base64-js');

// SystemModules


// CommonModules
const router = require('express').Router();
const common = require('../common');
const mods = common.Mods.modConst;
const modHelper = common.Mods.getMods;
const playModes = common.playModes;
const rankedStatus = common.rankedStatus;
const mysql = common.MySQLManager;
const usertools = common.UserTools;
const beatmaphelper = require('../helpers/beatmap');
const leaderboardCalc = require('./leaderboardcalc');
const config = require('../config');
const util = require('util');
const eventtool = common.EventTool;
const crypto = common.Crypto;
const timehelper = require('../helpers/time');
const modhelper = common.Mods;

// PP
const PPCalculator = require('../pp');

function decryptdata(scoreenc, iv, osuver) {
  let key;
  if (osuver != null && osuver != undefined)
    key = 'osu!-scoreburgr---------' + osuver;
  else
    key = 'h89f2-890h2h89b34g-h80g134n90133';
  // 
  const s = base64.toByteArray(scoreenc);
  const i = base64.toByteArray(iv);
  const cipher = new Rijndael(key, "cbc")
  const scoreData = cipher.decrypt(s, 256, i).toString();
  return scoreData;
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
    || (modSTRING.includes('EZ') && modSTRING.includes('EZ'))
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
  res.send(await submit(req.body, req.file))
});

async function submit(body, file) {
  try {
    let output = [];
    if (body.score == null || body.score == undefined || body.iv == null || body.iv == undefined || body.pass == null || body.pass == undefined)
      throw 'beatmap';


    const decryptscoreData = decryptdata(body.score, body.iv, body.osuver);
    // Process list got removed on on 2018
    // const ProcessList = decryptdata(body.pl, body.iv, body.osuver);

    const scoreData = decryptscoreData.split(":");
    const SecurityHash = trim(decryptdata(body.s, body.iv, body.osuver));
    const someDetections = decryptdata(body.fs, body.iv, body.osuver).split(':')

    let somedetects = []
    for (let i = 0; i < someDetections.length; i++) {
      const element = someDetections[i];
      if (element.startsWith('False')) somedetects.push(false);
      else if (element.startsWith('True')) somedetects.push(true);
    }

    let bmk = false;
    let bml = false;
    if (body.bmk != null || body.bmk != undefined && body.bml != null || body.bmk != undefined) {
      bmk = body.bmk;
      bml = body.bml;
    }
    const fileMD5 = scoreData[0];
    const username = trim(scoreData[1]);
    const ScoreHASH = trim(scoreData[2]); //TODO Bruteforce the ScoreHash
    const three = Number(scoreData[3]);
    const hundred = Number(scoreData[4]);
    const five = Number(scoreData[5]);
    const Geki = Number(scoreData[6]);
    const Katu = Number(scoreData[7]);
    const Miss = Number(scoreData[8]);
    const score = Number(scoreData[9]);
    const maxCombo = Number(scoreData[10]);
    const FullCombo = scoreData[11] == 'True';
    const ArchivedLetter = scoreData[12];
    const mods = Number(scoreData[13]);
    const passed = scoreData[14] == 'True';
    const mode = Number(scoreData[15]);
    const OsuDate = Number(scoreData[16]);
    const date = PythonTime();
    const rawVersion = scoreData[17];
    const OsuVersion = Number(scoreData[17]);
    const BadFlag = (length(rawVersion) - length(trim(rawVersion))) & ~4;
    const userid = await usertools.getuserid(username);
    const password = body.pass;

    const isLoggedin = await usertools.checkLoggedIn(userid, password);
    if (!isLoggedin) throw 'pass';

    const accuracy = PPCalculator.calcacc(three, hundred, five, Miss, Katu, Geki, mode);
    return "ok";
  } catch (ex) {
    switch (ex) {
      default:
        console.error(ex);
        break;
    }
  }
}

function archivementMaker(Object = { Badge: 'all-secret-jackpot', Title: 'Here come dat PP', Description: 'Oh shit waddup' }) {
  return Object.Badge + '+' + Object.Title + '+' + Object.Description;
}

async function gotfirstPlace(beatmaphash = '', score_hash = '') {
  let result = await mysql.query('SELECT * FROM scores WHERE beatmap_md5=? ORDER BY score DESC LIMIT 1', [beatmaphash]);
  if (result[0].score_hash == score_hash) return true;
  else return false;
}
module.exports = router;