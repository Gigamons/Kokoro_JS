let scoreboards = [];
let TimeHelper = require('../helpers/time');

setInterval(
    () => {
        removeExpiredBoards();
    }, //Handler
    (TimeHelper.minute * 5) // 5 Minutes in MS
);

function addScoreBoard(OBJECT = {}) {
    if(!scoreboardExists(OBJECT.User.UserID))
        scoreboards.push(OBJECT);
    else { // Infinity loop, should work fine.
        removeScoreboard(OBJECT.User.UserID);
        addScoreBoard(OBJECT);
    };
}

function removeScoreboard(beatmaphash = '') {
    let scoreInfo = scoreboardInfo(beatmaphash);
    if(scoreInfo)
        scoreboards.splice(scoreInfo[0], 1);
}

function removeExpiredBoards() {
    let curtime = new Date().getTime();
    for (let i = 0; i < scoreboards.length; i++) {
        const e = scoreboards[i];
        if(e.Expire < curtime){
            let bmhash = e.beatmapmd5;
            removeScoreboard(bmhash);
        }
    }
}

function scoreboardInfo(beatmaphash = '') {
    for (let i = 0; i < scoreboards.length; i++) {
        const element = scoreboards[i];
        if(element.beatmapmd5 == beatmaphash)
            return [i, element];
    }
    return false;
}

function scoreboardExists(beatmaphash = '') {
    for (let i = 0; i < scoreboards.length; i++) {
        const element = scoreboards[i];
        if(element.beatmapmd5 == beatmaphash)
            return true;
    }
    return false;
}

module.exports = {
    scoreboards,
    addScoreBoard,
    removeScoreboard,
    removeExpiredBoards,
    scoreboardInfo,
    scoreboardExists
}