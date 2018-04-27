const {
  Stream
} = require('stream')
const common = require('../common');
const fs = require('fs');
const {
  join
} = require('path');
const {
  format
} = require('util');

const mysql = common.MySQLManager;
const OsuPacket = require('../other/osu-packet');
const OsuBuffer = require('../other/osu-buffer');
const md5hash = common.Crypto.md5String;

const beatmapHelper = require('../helpers/beatmap');

let datatypes = {
  int8: 'int8',
  uint8: 'uint8',
  int16: 'int16',
  uint16: 'uint16',
  int32: 'int32',
  uint32: 'uint32',
  int64: 'int64',
  uint64: 'uint64',
  string: 'string',
  dstring: 'defaultstring',
  float: 'float',
  double: 'double',
  boolean: 'boolean',
  byte: 'byte',
  int32array: 'int32array',
  rawreplay: 'rawreplay'
}

function Write(o) {
  let buff = new OsuBuffer();
  switch (o[1]) {
    case 'int8':
      buff.WriteInt8(o[0]);
      break;
    case 'uint8':
      buff.WriteUInt8(o[0]);
      break;
    case 'int16':
      buff.WriteInt16(o[0]);
      break;
    case 'uint16':
      buff.WriteUInt16(o[0]);
      break;
    case 'int32':
      buff.WriteInt32(o[0]);
      break;
    case 'uint32':
      buff.WriteUInt32(o[0]);
      break;
    case 'int64':
      buff.WriteInt64(o[0]);
      break;
    case 'uint64':
      buff.WriteUInt64(o[0]);
      break;
    case 'string':
      buff.WriteOsuString(o[0], o[2]);
      break;
    case 'defaultstring':
      buff.WriteString(o[0], o[2]);
      break;
    case 'float':
      buff.WriteFloat(o[0]);
      break;
    case 'double':
      buff.WriteDouble(o[0]);
      break;
    case 'boolean':
      buff.WriteBoolean(o[0]);
      break;
    case 'byte':
      buff.WriteByte(o[0]);
      break;
    case 'int32array':
      {
        buff.WriteInt16(o[0].length);
        for (let i = 0; i < o[0].length; i++) {
          buff.WriteInt32(o[0][i]);
        }
        break;
      }
    case 'rawreplay':
      {
        buff.WriteUInt32(o[0].length)
        .WriteBuffer(o[0]);
        break;
      }
  }
  return buff.buffer;
}

function Pack(arr = []) {
  let stream = new Stream.PassThrough;
  for (let i = 0; i < arr.length; i++) {
    const element = Write(arr[i]);
    stream.push(element);
  }
  return stream.read();
}

// TODO: Rewrite to fit to the new Score table.
async function get(replayHash) {
  try {
    const BaseWriter = new OsuPacket.Base.Writer;

    const Layouts = OsuPacket.Layouts;

    const scoreData = await mysql.query('SELECT scores.*, users.username FROM scores LEFT JOIN users ON scores.userid = users.id WHERE scores.replay_hash = ?', [replayHash]);
    if (!scoreData[0])
      throw 404;
    let file = {
      path: '',
      rawFile: new Buffer(''),
      file: new Buffer('')
    }
    file.path = join(__dirname + '/../files/replay/' + replayHash + '.osr');
    file.rawFile = fs.readFileSync(file.path);
    let ArchivedRank = common.getRank(scoreData[0].play_mode, scoreData[0].mods, scoreData[0].accuracy, scoreData[0].three, scoreData[0].hundred, scoreData[0].five, scoreData[0].misses);
    let fc = Boolean(scoreData[0].full_combo) ? 'True' : 'False';

    //let formatedstring = `${(scoreData[0].hundred + scoreData[0].three)}p${scoreData[0].five}o${scoreData[0].gekis}o${scoreData[0].katus}t${scoreData[0].misses}a${scoreData[0].beatmap_md5}r${scoreData[0].max_combo}e${fc}y${scoreData[0].username}o${scoreData[0].score}u${ArchivedRank}${scoreData[0].mods}${"True"}`
    let formatedstring = `${scoreData[0].max_combo}osu${scoreData[0].username}${scoreData[0].beatmap_md5}${scoreData[0].score}${ArchivedRank}`
    let localscorehash = md5hash(formatedstring);
    const time = require('../helpers/time');

    let fullReplay = Pack([
      [scoreData[0].play_mode, datatypes.byte],
      [20140721, datatypes.int32],
      [scoreData[0].beatmap_md5, datatypes.string],
      [scoreData[0].username, datatypes.string],
      [localscorehash, datatypes.string],
      [scoreData[0].three, datatypes.uint16],
      [scoreData[0].hundred, datatypes.uint16],
      [scoreData[0].five, datatypes.uint16],
      [scoreData[0].gekis, datatypes.uint16],
      [scoreData[0].katus, datatypes.uint16],
      [scoreData[0].misses, datatypes.uint16],
      [scoreData[0].score, datatypes.int32],
      [scoreData[0].max_combo, datatypes.uint16],
      [scoreData[0].full_combo, datatypes.byte],
      [scoreData[0].mods, datatypes.int32],

      [0, datatypes.byte], // Graphs = false. Becourse we dont have it /shrug
      [0, datatypes.uint64], // Our current time 0 if corrupted

      [file.rawFile, datatypes.rawreplay], // Our ReplayData

      [0, datatypes.uint32], // OnlineID (Idk)
      [0, datatypes.uint32] // Mod Info (IDK)
    ]);
    if (fs.existsSync(join(__dirname + '/../files/replays/' + replayHash + '.osr')))
      fs.unlinkSync(join(__dirname + '/../files/replays/' + replayHash + '.osr'));
    fs.writeFileSync(join(__dirname + '/../files/replays/' + replayHash + '.osr'), fullReplay);
    setTimeout(() => {
      console.log("Done");
      process.exit(0);
    }, 1000);
  } catch (ex) {
    console.log(ex);
  }
}

module.exports = get;