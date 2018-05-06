const common = require('../common');

const mysql = common.MySQLManager;
const usertools = common.UserTools;

const fs = require('fs');
const path = require('path');

// TODO: Rewrite to fit to the new Score table.
async function get(query) {
    try {
        // Parameters
        const username = query.u;
        const password = query.h;
        const replayID = query.c;
        // If something doesent exists throw No
        if(username && password && replayID){
            // Get UserID
            const userid = await usertools.getuserid(username);
            // if username not exists throw UserNotLoggedInException
            if(!userid) throw 'pass';
            // Check if user is connected to our Bancho
            const checkLoggedIn = await usertools.checkLoggedIn(userid, password);
            // same again if User is not LoggedIn throw UserNotLoggedInException (wtf long word)
            if(!checkLoggedIn) throw 'pass';
            // if something is invalid throw invalid
            if(replayID == '0' || replayID == ''){
                throw 'invalid';
            }
            // Now lets get our ScoreData
            let scoreData = await mysql.query('SELECT replay_hash FROM scores WHERE scoreid = ?', replayID)
            // If Score found
            if(scoreData[0]){
                // Send raw replay! NOT FULL REPLAY! becourse osu is gonna compile it to a FullReplay
                return Buffer.from((await mysql.query('SELECT * FROM replays WHERE replay_hash = ?', scoreData[0].replay_hash))[0].replay, "HEX");
            }
            return ''
        } else throw 'No'
    } catch(ex){
        switch (ex) {
            case 'pass':
                return 'error: pass';
                break;
            case '':
                return '';
                break;
            default:
                console.error(ex);
                return 'error: '+ex
                break;
        }
    }
}

module.exports = get;