const time = require('./helpers/time');
const PPCalculator = require('./pp');
const common = require('./common');
const colors = require('colors');
const leaderboardcalc = require('./handlers/leaderboardcalc');
let fs = require('fs');
const { join } = require('path');
const bluebird = require('bluebird');
const os = require('os');

bluebird.promisifyAll(fs);

const mysql = common.MySQLManager;
const crypto = common.Crypto;

const args = process.argv;

let fullArgsList = [];

let all = getArgument(['--all', '-a'], 'Recalculate Everything that doesent have "(DEBUG)"');
let leaderboardonly = getArgument(['--leaderboardonly', '-lb'], 'Recalc Leaderboard only');
let deletenoreplayscores = getArgument(['--deletenoreplayscores', '-dlnr'], 'Deletes non submited scores. Means if the score doesent have any replay. (DEBUG)');;
let none = getArgument(['--none', '-n'], 'Dont recalc something. (DEBUG)');
let recalctime = getArgument(['--recalctime', '-t'], 'Recalculate Time (DEBUG');
printHelpPage();

function animatetitle () {
    title = 'Scores Calculator';
    let frames = [
        '...:::Scores Calculator:::...',
        ' ..:::Scores Calculator:::.. ',
        '  .:::Scores Calculator:::.  ',
        '   :::Scores Calculator:::   ',
        '    ::Scores Calculator::    ',
        '     :Scores Calculator:     ',
        '      Scores Calculator      ',
        '       cores Calculato       ',
        '        ores Calculat        ',
        '         res Calcula         ',
        '          es Calcul          ',
        '           s Calcu           ',
        '             Calc            ',
        '             Cal             ',
        '              a              ',
        '                             ',
    ]
    let currentframe = frames[0];
    async function loop(params) {
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            await sleep(60);
            process.title = frame;
        }
        for (let i = 15; i < frames.length; i--) {
            const frame = frames[i];
            await sleep(60);
            process.title = frame;
            if(i == 0) break;
        }
        loop();
    }
    loop();
}

async function sleep(MS = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, MS);
    })
}

function length(string) {
    return new Buffer(String(string)).byteLength;
}

function PythonTime() {
    let currentdate = new Date().valueOf();
    let date = String(currentdate);
    let pythontime = Number(date.substring(0, (length(date)-3)))
    return pythontime;
}

async function calc() {
    if(none) return;
    if(deletenoreplayscores)
        await mysql.query("DELETE FROM scores WHERE replay_hash = '' OR replay_hash = '0' AND completeStatus='3'")
    const result = await mysql.query('SELECT * FROM scores');
    const users = await mysql.query('SELECT * FROM users');
    let y = 0;
    let totalpp = 0;
    let t = 0, h = 0, f = 0, m = 0;
    let totalscore = 0;
    let totalFC = 0;
    if(!leaderboardonly){
        for (let i = 0; i < result.length; i++) {
            ++y;
            const q = result[i];
            let oldScoreHash = q.score_hash;
            let r = {
                id: q.scoreid,
                beatmap_md5: q.beatmap_md5,
                score_hash: '',
                replay_hash: q.replay_hash,
                replay_hashfile: join(__dirname + '/./files/replay/'+q.replay_hash+'.osr'),
                userid: q.userid,
                score: q.score,
                max_combo: q.max_combo,
                full_combo: q.full_combo,
                mods: q.mods,
                three: q.three,
                hundred: q.hundred,
                five: q.five,
                katus: q.katus,
                gekis: q.gekis,
                misses: q.misses,
                time: q.time,
                play_mode: q.play_mode,
                completeStatus: q.completeStatus,
                accuracy: q.accuracy,
                pp: q.pp
            }
            if(recalctime) r.time = PythonTime();

            if(!fs.existsSync(r.replay_hashfile)){
                r.replay_hash = '0';
            }
            r.accuracy = PPCalculator.calcacc(r.three, r.hundred, r.five, r.misses, r.katus, r.gekis, r.play_mode);
            switch (r.play_mode) {
                case 0:
                    try{
                        let osuPP = await PPCalculator.oppai({
                            beatmaphash: r.beatmap_md5,
                            accuracy: r.accuracy,
                            mods: r.mods,
                            three: r.three, hundred: r.hundred, five: r.five, miss: r.misses,
                            maxcombo: r.max_combo,
                            taiko: false
                        })
                        if(osuPP.pp == undefined || osuPP == null || osuPP == NaN) r.pp = 0
                        else r.pp = osuPP.pp;
                    } catch(ex){ // If beatmap not added, it'll throw an Error!
                        r.pp = 0;
                    }
                    break;
                case 1:
                    try{
                        let taikoPP = await PPCalculator.oppai({
                            beatmaphash: r.beatmap_md5,
                            accuracy: r.accuracy,
                            mods: r.mods,
                            three: r.three, hundred: r.hundred, five: r.five, miss: r.misses,
                            maxcombo: r.max_combo,
                            taiko: true
                        })
                        if(taikoPP.pp == undefined || taikoPP.pp == null) r.pp = 0
                        else r.pp = taikoPP.pp;
                    } catch(ex){ // If beatmap not added, it'll throw an Error!
                        r.pp = 0;
                    }
                    break;
                case 2:
                    r.pp = 0;
                    break;
                case 3:
                    r.pp = 0;
                    break;
            }
            r.score_hash = crypto.md5String(''+r.beatmap_md5 + r.userid + r.score + r.max_combo + r.full_combo + r.mods + r.three + r.hundred + r.five + r.katus + r.gekis + r.misses + r.time + r.play_mode + r.completeStatus + r.accuracy + r.pp);
            mysql.query('UPDATE scores SET accuracy = ?, pp = ?, score_hash = ?, replay_hash = ?, userid = ?, completeStatus = ?, time = ? WHERE scoreid = ?', [r.accuracy, r.pp, r.score_hash, r.replay_hash, r.userid, r.completeStatus, r.time, r.id]);
            let header = '...:::Calculating Scores:::...'
            console.clear();
            console.log(header.green)
            console.log('Calculate score ID: '+y+' of '+ + result.length)
            console.log('Status: '+'Working'.green+', '+colors.red(+String(y/result.length*100).split('.')[0]+'%')+' done')
            console.log('ScoreHash: '+colors.yellow(r.score_hash), 
            '\nScore: '+colors.yellow(r.score)+
            '\nAccuracy: '+colors.red(r.accuracy), 
            '\nPP: '+colors.gray(r.pp), 
            '\nPlayMode: '+colors.yellow(r.play_mode));
            console.log('D: '+colors.cyan(r.three)+', H: '+colors.green(r.hundred)+', F: '+colors.blue(r.five)+', M: '+colors.red(r.misses))
            console.log('FC: '+colors.red(r.full_combo));
            console.log('MaxCombo: '+colors.red(r.max_combo));
            console.log('Ram Usage: '+MemoryUsageGB());
            //console.log('CPU Usage: '+CPUUsage());
            console.log(colors.green(dothelper(header.length)))
            t = (t + r.three);
            h = (h + r.hundred);
            f = (f + r.five);
            m = (m + r.misses);
            totalscore = (totalscore + r.score);
            totalpp = (totalpp + Number(String(r.pp).split('.')[0]));
            totalFC = (totalFC + r.full_combo);
        }
    }
    for (let i = 0; i < users.length; i++) {
        const element = users[i];
        if(element.id != 100){ // Make sure that the bot DONT get calculated. to spare CPU and Memory
            await leaderboardcalc(element.id);
        }
        let percent = i/(users.length - 1)*100;
        let header = '...:::Calculating Leaderboard:::...'
        console.clear();
        console.log(header.green);
        console.log('Calculate UserID: '+i+' of '+(users.length - 1));
        console.log('Status: '+'Working'.green+', '+(colors.red(String(percent).split('.')[0]+'%'))+' done');
        console.log(colors.green(dothelper(header.length)));
    }
    if(y == result.length){
        let header = '...:::Score Recalculator:::...';
        let totalacc = PPCalculator.calcacc(t, h, f, m, 0, 0, 0)
        console.clear();
        console.log(header.green)
        console.log('Status: '+'Done'.green+', '+colors.green(y)+' Scores Calculated')
        console.log('Total PP: '+colors.red(totalpp));
        console.log('Total Score: '+colors.red(totalscore));
        console.log('Total Threehundreds: '+colors.cyan(t));
        console.log('Total Hundreds: '+colors.green(h));
        console.log('Total Fiftys: '+colors.yellow(f));
        console.log('Total Accuracy: '+colors.red(String(totalacc)).slice(0, 5));
        console.log('Total FC\'s: '+colors.red(totalFC));
        console.log(colors.green(dothelper(header.length)))
        process.exit(0);
    }
    if(leaderboardonly){
        let header = '...:::Score Recalculator:::...';
        let totalacc = PPCalculator.calcacc(t, h, f, m, 0, 0, 0)
        console.clear();
        console.log(header.green)
        console.log('Status: '+'Done'.green+', '+colors.green(y)+' Leaderboards Calculated')
        console.log(colors.green(dothelper(header.length)))
        process.exit(0);
    }
}

function formatByte(b, d) {
    let sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    if(b == 0) return {b: 0, t: 'B'};
    let dm = d || 2;
    let i = Math.floor(Math.log(b) / Math.log(1024));
    return {
        b: (b / Math.pow(1024, i)).toFixed(dm),
        t: sizes[i]
    };
}

function MemoryUsageGB() {
    let FreeMem = formatByte(os.freemem());
    let TotalMem = formatByte(os.totalmem());
    return FreeMem.b+' / '+TotalMem.b+' '+TotalMem.t+' '+MemoryUsage()+'%';
}

function MemoryUsage() {
    let FreeMem = os.freemem();
    let TotalMem = os.totalmem();
    let TotalUsage = FreeMem / TotalMem*100;
    return Number(TotalUsage.toFixed(2));
}

function printHelpPage() {
    let allargsfalse = true;
    let header = '...:::Help Page:::...';
    for (let i = 0; i < fullArgsList.length; i++) {
        const element = fullArgsList[i];
        if(element.boolean) allargsfalse = false;
    }
    if(allargsfalse){
        console.clear();
        console.log(header.green);
        for (let i = 0; i < fullArgsList.length; i++) {
            const element = fullArgsList[i];
            console.log(''+element.Argument[0]+', '+element.Argument[1]+', '+element.Description);
        }
        console.log(colors.green(dothelper(header.length)));
        process.exit(0);
    }
}

function dothelper(length) {
    let out = '';
    for (let i = 0; i < length; i++) {
        out += '.'
    }
    return out;
}

animatetitle();
calc().catch( (ex) => {
    let header = '...:::Score Recalculator:::...';
    console.clear();
    console.log(header.green)
    console.log('Status: '+'Error!'.red+',');
    console.error(ex);
    console.log(colors.green(dothelper(header.length)))
    process.exit(1);
});


function getArgument(arguments = [], description = '') {
    const args = process.argv;
    let includedrequireargs = false;
    for (let arg = 0; arg < arguments.length; arg++) {
        const e = arguments[arg];
        for (let i = 0; i < args.length; i++) {
            const element = args[i];
            if(element == e){
                includedrequireargs = true;
            }
        }
    }
    fullArgsList.push({
        Argument: arguments,
        Description: description,
        boolean: includedrequireargs
    });
    if(includedrequireargs) return true;
    else return false;
}