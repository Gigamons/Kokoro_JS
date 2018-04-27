const readChunk = require('read-chunk');
const fileType = require('file-type');
const { join } = require('path');
const fs = require('fs');
const indection = require('identicon.js');
const time = require('../helpers/time');
const request = require('request');
let cacheduserids = [];
const crypto = require('../common').Crypto

function getuserid(id = 0) {
  for (let i = 0; i < cacheduserids.length; i++) {
    const element = cacheduserids[i];
    if (element.id === id)
      return element;
  }
  return false;
}

function removeuserid(id = 0) {
  for (let i = 0; i < cacheduserids.length; i++) {
    const e = cacheduserids[i];
    if (e.id === id)
      cacheduserids.splice(i, 1);
  }
}

setInterval(() => {
  for (let i = 0; i < cacheduserids.length; i++) {
    const e = cacheduserids[i];
    if (e.expiredate < new Date().getTime())
      cacheduserids.splice(i, 1);
  }
}, time.Minute * 5);

function get(res, req) {
  const id = req.url.split("/")[1];
  const expiredate = new Date().getTime() + time.Minute * 10;
  const Path = join(__dirname + '/../files/avatars/' + id);
  const PathDefault = join(__dirname + '/../files/avatars/0');
  if (fs.existsSync(Path)) {
    const cacheduser = getuserid(id);
    const file = fs.readFileSync(Path);
    const buffer = readChunk.sync(Path, 0, 4100);
    const FileType = fileType(buffer);
    if (cacheduser) {
      res.writeHead(200, {
        "Content-Type": cacheduser.mime
      });
      res.write(cacheduser.file);
      res.end();
    } else {
      res.writeHead(200, {
        "Content-Type": FileType.mime
      });
      res.write(FileType.file);
      res.end();
      cacheduserids.push({ id, file: FileType.file, mime: FileType.mime, expiredate });
    }
  } else {
    function rcol() {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return hexToRgbA(color);
    }
    let cacheduser = getuserid(id);
    res.writeHead(200, {
      "Content-Type": "image/png"
    });
    if (!cacheduser) {
      const i = new indection(crypto.hashedString(String(id), 'sha512')).toString();
      i.background = rcol();
      i.size = 256;
      const b = Buffer.from(i.toString(), 'base64');
      cacheduserids.push({ id, file: b, expiredate });
      res.write(b);
    } else {
      res.write(cacheduser.file);
    }

    res.end();
  }
}

// Copy pasted from https://stackoverflow.com/questions/21646738/convert-hex-to-rgba
function hexToRgbA(hex) {
  var c;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return [(c >> 16) & 255, (c >> 8) & 255, c & 255, (c >> 4) & 255];
  }
  return [255, 255, 255, 255];
}

module.exports = {
  get
}