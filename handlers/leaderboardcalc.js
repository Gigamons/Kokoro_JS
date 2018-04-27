const common = require('../common');
const beatmap = require('../helpers/beatmap');
const everythingisranked = require('../config').Kokoro.everythingisranked;
const calcAcc = require('../pp').calcacc;
const mysql = common.MySQLManager;

const completeStatus = {
    default: 2 << 1,
    passed: 2 << 2,
    ranked: 2 << 3
}

function hasStatus(completeStatusUser, completeStatus){
    let out = completeStatusUser & completeStatus;
    return out > 0 ? true : false;
}

// Todo: Full rewrite.
async function recalcUser2(userid = 0) {
    
}

module.exports = recalcUser2;