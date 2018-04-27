const config = require('../../config');
const utils = require('util');
const color = require('colors');

const log = (s)=>{
    let pref;
    switch(s){
    case 'success':
        pref = '[S]'.green;
        break;
    case 'failed':
        pref = '[!]'.red;
        break;
    case 'info':
        pref = '[I]'.cyan;
        break;
    default:
        pref = '[D]'.yellow;
        break;
    }
    return pref;
};
module.exports = {
    success(Message, param = []){
        console.log(log('success')+utils.format(Message, param)+log('success'));
    },
    error(Message, param = []){
        console.log(log('failed')+utils.format(Message, param)+log('failed'));
    },
    debug(Message, param = []){
        if(config.server.debug){
            console.log(log('debug')+utils.format(Message, param)+log('debug'));
        }
    },
    log(Message, param = []){
        if(config.server.debug){
            console.log(log('debug')+utils.format(Message, param)+log('debug'));
        }
    },
    dir(Message){
        if(config.server.debug){
            console.dir(Message);
        }
    }
};