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
            let scoreData = await mysql.query('SELECT scores.*, users.username AS uname FROM scores LEFT JOIN users ON scores.userid = users.id WHERE scores.scoreid = ?', [replayID])
            // If Score found
            if(scoreData[0]){
                // Send raw replay! NOT FULL REPLAY! becourse osu is gonna compile it to a FullReplay
                let filePath = path.join(__dirname + '/../files/replay/'+scoreData[0].replay_hash+'.osr');
                return fs.readFileSync(filePath);
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
                return 'error: '+ex
                break;
        }
    }
}

module.exports = get;