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

async function submit(req, res) {
  const body = req.body;
  const file = req.file;
  console.dir(file);
}

function archivementMaker(Object = { Badge: 'all-secret-jackpot', Title: 'Here come dat PP', Description: 'Oh shit waddup' }) {
  return Object.Badge + '+' + Object.Title + '+' + Object.Description;
}

async function gotfirstPlace(beatmaphash = '', score_hash = '') {
  let result = await mysql.query('SELECT * FROM scores WHERE beatmap_md5=? ORDER BY score DESC LIMIT 1', [beatmaphash]);
  if (result[0].score_hash == score_hash) return true;
  else return false;
}
module.exports = submit;