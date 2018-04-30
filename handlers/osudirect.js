const osusearchset = require('express').Router();
const osusearch = require('express').Router();
const common = require('../common');
const request = require('request');
const requesth = require('../helpers/requestHelper');
const config = require('../config');
const url = require('url');
const urlencode = require('urlencode');

const mysql = common.MySQLManager;
const UserTools = common.UserTools


/*

999 765548.osz
Wayne Sharpe and John Siegler
Yugioh! Theme
Sotarks
1
8.071717739105225.00
2018-04-18T04:10:22Z
765548|765548|0|0|1337||Duel!
 (5.07★~140♫~AR9.3~OD8.7~CS4.2~HP5~1m12s)@0,Insane 
 (4.00★~140♫~AR8.3~OD7.8~CS4~HP4.7~1m12s)@0,Expert
 (4.02★~140♫~AR9~OD8.2~CS4~HP5~1m12s)@0,Nao's Hard
 (2.89★~140♫~AR7~OD6~CS3.5~HP4~1m12s)@0,Akitoshi's Normal 
 (1.72★~140♫~AR5~OD4~CS3~HP4~1m12s)@0
*/

const convertToCheesegull = (rankedStatus) => {
  switch (rankedStatus) {
    case 0:
      return 1;
      break;
    case 2:
      return 0;
      break;
    case 3:
      return 3;
      break;
    case 4:
      return null;
      break;
    case 5:
      return -2;
      break;
    case 7:
      return 2;
      break;
    case 8:
      return 4;
      break;
    default:
      return 1;
      break;
  }
}

class direct {

  constructor(rankedStatus = 0, query = '', page = 0, mode = -1, set = 0, bm = 0) {
    this.rankedStatus = rankedStatus || 0;
    this.query = query || '';
    this.page = (page || 0) * 100;
    this.playMode = mode;
    this.Beatmaps = [];
    this.set = set;
    this.bm = bm;
  }

  Search() {
    return new Promise((resolve, reject) => {

      // Todo: Add Top Rated and Most Played.
      if (["newest", "top rated", "most played"].includes(this.query.toLowerCase()))
        this.query = '';



      const uri = new url.URL(config.cheesegull.api + '/search');

      uri.searchParams.set('mode', this.playMode);
      uri.searchParams.append('amount', 100);
      uri.searchParams.append('offset', this.page);
      uri.searchParams.append('status', convertToCheesegull(this.rankedStatus));
      uri.searchParams.append('query', this.query);

      console.dir(this.playMode);


      request(url.format(uri), (err, response, body) => {
        if (err) {
          console.error(err);
          reject(err);
          return;
        }
        this.Beatmaps = JSON.parse(body);
        resolve()
      });
    });
  }

  async NP() {
    let uri = new url.URL(config.cheesegull.api + '/s/' + this.set);
    if (this.bm > 0)
      uri = new url.URL(config.cheesegull.api + '/b/' + this.bm);

    let req = await requesth.request_get(url.format(uri))

    if(!JSON.parse(req.body)) return;
    if(this.bm > 0) {
      req = await requesth.request_get(config.cheesegull.api + '/s/' + (JSON.parse(req.body)).ParentSetID)
    }
    return JSON.parse(req.body);
  }

  async toNPString() {
    this.Beatmap = await this.NP();
    if (!this.Beatmap)
      return `0`;
    return `${this.Beatmap.SetID}.osz|${this.Beatmap.Artist}|${this.Beatmap.Title}|${this.Beatmap.Creator}|${this.Beatmap.RankedStatus}|10.00|${this.Beatmap.LastUpdate}|${this.Beatmap.SetID}|${this.Beatmap.SetID}|${Number(this.Beatmap.HasVideo) || 0}|0|1234|${(this.Beatmap.HasVideo ? "4321" : "")}\r\n`
  }

  async toSearchString() {
    let outputString = "";
    await this.Search();

    if (this.Beatmaps.length >= 100)
      outputString += "999";
    else
      outputString += this.Beatmaps.length;

    outputString += "\n";

    for (let i = 0; i < this.Beatmaps.length; i++) {
      const beatmapset = this.Beatmaps[i];
      let maxdif = 0.00;
      for (let bms = 0; bms < beatmapset.ChildrenBeatmaps.length; bms++) {
        const bm = beatmapset.ChildrenBeatmaps[bms];
        if (bm.DifficultyRating > maxdif)
          maxdif = bm.DifficultyRating;
      }
      maxdif = Math.round(maxdif += 3);
      outputString += `${beatmapset.SetID}.osz|${beatmapset.Artist}|${beatmapset.Title}|${beatmapset.Creator}|` +
        `${beatmapset.RankedStatus}|${maxdif}.00|${beatmapset.LastUpdate}|${beatmapset.SetID}|` +
        `${beatmapset.SetID}|${Number(beatmapset.HasVideo) || 0}|0|1234|${(beatmapset.HasVideo ? "4321" : "")}|`
      for (let y = 0; y < beatmapset.ChildrenBeatmaps.length; y++) {
        const cbm = beatmapset.ChildrenBeatmaps[y];
        outputString += `${(cbm.DiffName.replace(/@/g, ""))} (${Number(cbm.DifficultyRating.toFixed(2))}★~${cbm.BPM}♫~AR${cbm.AR}~OD${cbm.OD}~CS${cbm.CS}~HP${cbm.HP}~${Math.floor(cbm.TotalLength / 60)}m${cbm.TotalLength % 60}s)@${cbm.Mode},`
      }
      outputString += '\r\n';
    }

    outputString = outputString.slice(0, -1);
    outputString += '|';
    return outputString;
  }
}

osusearchset.use(async (req, res) => {
  res.send(await new direct(0, 0, 0, 0, Number(req.query.s), Number(req.query.b)).toNPString(Number(req.query.s)))
});

osusearch.use(async (req, res) => {
  const Direct = new direct(Number(req.query.r), req.query.q, Number(req.query.p), Number(req.query.m));
  res.send(await Direct.toSearchString())
});

module.exports = {
  osusearchset,
  osusearch
};