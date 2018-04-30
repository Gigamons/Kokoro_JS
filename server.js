const cluster = require('cluster');
const config = require('./config');
const fs = require('fs');

const os = require('os');

const common = require('./common');
const handlers = require('./handlers');

const multer = require('multer');
const express = require('express');
const app = express();

let replay = multer({
  dest: 'files/replay/'
});

const requestHelper = require('./helpers/requestHelper');
const redis = common.RedisManager;
const mysql = common.MySQLManager;
const logger = common.Logger;
const redirect = handlers.redirect;
const submit = handlers.SubmitModular;
const updater = handlers.Updater;
const scoreboard = handlers.Scoreboard;
const osudirect = handlers.osudirect;
const okOutput = handlers.okOutput;
const empty = handlers.empty;
const SSHandler = handlers.SSHandler;
const TimeHelper = require('./helpers/time');


if (!fs.existsSync('./files/')) fs.mkdirSync('./files/avatars');
if (!fs.existsSync('./files/')) fs.mkdirSync('./files');
if (!fs.existsSync('./files/osu/')) fs.mkdirSync('./files/osu');
if (!fs.existsSync('./files/ss/')) fs.mkdirSync('./files/ss');
if (!fs.existsSync('./files/replay/')) fs.mkdirSync('./files/replay');
if (!fs.existsSync('./files/replays/')) fs.mkdirSync('./files/replays');

let cachedURLS = [];


setInterval(() => {
  let currentTime = new Date().getTime();
  for (let i = 0; i < cachedURLS.length; i++) {
    const e = cachedURLS[i];
    if (e.expiredate < currentTime)
      cachedURLS.splice(i, 1);
  }
}, 100);

// Middleware for Debugging and for Avatar Server
app.use((req, res, next) => {
  if (req.hostname.startsWith('a.')) {
    handlers.avatar.get(res, req);
    return;
  }

  console.log(
    req.protocol + '://' + req.hostname + req.url
  );
  if(req.body)
    console.dir(req.body);
    
  next();
});

app.get('/web/osu-osz2-getscores.php', async (req, res) => {
  if (checkAllowed(req)) {
    let ip = req.header('X-Real-IP');
    // let maybeCache = geturl(req.url);
    if (ip == "127.0.0.1" || ip == '0.0.0.0')
      ip = '';
    let cacheduri = cachedURL(TimeHelper.minute * 5)
    cacheduri.output = await scoreboard(req.query, ip, req, res);
    cacheduri.url = req.url;
    res.send(cacheduri.output);
  }
});


app.get('/web/osu-search-set.php', osudirect.osusearchset);
app.get('/web/osu-search.php', osudirect.osusearch);

app.get('/d/', async (req, res) => {
  let id = req.url.split('/')[1];
  let r = ((await requestHelper.request_get(config.cheesegull.download + id)).body)
  res.end(r);
});

// 99.98% done
app.post('/web/osu-submit-modular.php', replay.single('score'), async (req, res) => {
  if (checkAllowed(req)) {
    let ip = req.header('X-Real-IP');
    if (ip == "127.0.0.1" || ip == '0.0.0.0')
      ip = '';
    const subModul = await submit(req.body, req.file, ip);
    const statusCode = subModul[0];
    const Out = subModul[1];

    res.status(statusCode);
    res.write(Out);
    res.end();
  }
});

app.get('/web/osu-checktweets.php', (req, res) => {
  if (checkAllowed(req))
    res.send('Do you want know what a Real PEEPEE is? (LennyFace)');
});

// Screenshot Handler
app.get('/ss/*', (req, res) => {
  let maybeCache = geturl(req.url);
  if (maybeCache) {
    let cache = maybeCache;
    res.writeHead(cache.statusCode, {
      "Content-Type": cache.mime
    })
    res.write(cache.output);
    res.end();
  } else {
    let ssHandlerout = SSHandler.get(req);
    let cache = cachedURL(TimeHelper.day);
    cache.url = req.url;
    cache.mime = ssHandlerout.MimeType;
    cache.statusCode = ssHandlerout.statusCode;
    cache.output = ssHandlerout.output;
    res.writeHead(cache.statusCode, {
      "Content-Type": cache.mime
    })
    res.write(cache.output);
    res.end();
    cachedURLS.push(cache)
  }
});

let ss = multer({
  dest: 'files/ss/'
});

app.post('/web/osu-screenshot.php', ss.single('ss'), async (req, res) => {
  if (checkAllowed(req)) {
    let SSHandlerSet = await SSHandler.set(req);
    res.writeHead(SSHandlerSet.statusCode, {});
    res.write(SSHandlerSet.output);
    res.end();
  }
});

// ReplayHandler
app.get('/web/osu-getreplay.php', async (req, res) => {
  if (checkAllowed(req)) {
    let maybeCache = geturl(req.url);
    if (maybeCache) {
      let cache = maybeCache;
      res.write(cache.output);
      res.end();
    } else {
      let replay = await handlers.getreplay(req.query);
      let cache = cachedURL(TimeHelper.day);
      cache.url = req.url;
      cache.output = replay;
      res.write(cache.output);
      res.end();
      cachedURLS.push(cache)
    }
  }
});

// Update Handler
app.get('/web/check-updates.php', updater);

// Not done yet
app.get('/web/lastfm.php', (req, res) => {
  res.send(empty);
});

app.get('/web/bancho_connect.php', (req, res) => {
  res.send('DE');
});

app.post('/web/osu-error.php', (req, res) => {
  res.send(empty);
});

app.get('/web/osu-rate.php', (req, res) => {
  res.send(empty);
});


app.use('/favicon.ico', (req, res) => {
  res.send(empty);
});

app.listen(config.server.port, () => {
  console.log("Server started at port " + config.server.port);
});

function checkAllowed(req) {
  let useragent = req.header('user-agent');
  if (useragent == 'osu!')
    return true;
  else return false;
}

async function updaterCache() {
  let all = [];
  const arr = ['CuttingEdge', 'StableLatest', 'Fallback', 'Beta'];
  try {
    all.push((await requestHelper.request_get('http://osu.ppy.sh/web/check-updates.php?action=check&stream=cuttingedge&time=0')).body);
    all.push((await requestHelper.request_get('http://osu.ppy.sh/web/check-updates.php?action=check&stream=stable40&time=0')).body);
    all.push((await requestHelper.request_get('http://osu.ppy.sh/web/check-updates.php?action=check&stream=stable&time=0')).body);
    all.push((await requestHelper.request_get('http://osu.ppy.sh/web/check-updates.php?action=check&stream=beta40&time=0')).body);

    let i = 0;
    all.forEach(async body => {
      const j = JSON.parse(body);
      const out = JSON.stringify(j, null, 2);
      redis.hmset('updater', [arr[i], out]);
      ++i;
    });
  } catch (ex) {
    console.log(ex);
  }
}

const cachedURL = (expire = 0) => {
  let currentTime = new Date().getTime();
  let expiredate = (currentTime + expire);
  return {
    url: '',
    output: '',
    expiredate: expiredate
  }
}

function geturl(url = '/') {
  for (let i = 0; i < cachedURLS.length; i++) {
    const element = cachedURLS[i];
    if (element.url == url)
      return element;
  }
  return false;
}

function removeurl(url = '/') {
  for (let i = 0; i < cachedURLS.length; i++) {
    const e = cachedURLS[i];
    if (e.url === url)
      cachedURLS.splice(i, 1);
  }
}