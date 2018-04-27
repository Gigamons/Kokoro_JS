const util = require('util');

const redis = require('../manager/redis');
const usertools = require('./user');

async function WriteEvent(JSONObject) {
    await redis.lpush('BanchoEvent', JSON.stringify(JSONObject));
    return;
}

async function WriteMessage(Obj = {from, to, message}) {
    let finishedobject = {
        event: 'BanchoMessage',
        from: Obj.from,
        to: Obj.to,
        message: Obj.message
    };
    await WriteEvent(finishedobject);
    return;
}

async function WriteAnnounce(Obj = {Message: '', to: 0}) {
    let finishedobject = {
        event: 'Announce',
        message: Obj.Message,
        to: Obj.to
    };
    console.dir(finishedobject);
    await WriteEvent(finishedobject);
    return;
}

async function WriteKick(User = 0, Message) {
    let finishedobject = {
        event: 'Kick',
        to: User,
        message: Message
    };
    await WriteEvent(finishedobject);
    return;
}

module.exports = {
    WriteEvent,
    WriteMessage,
    WriteAnnounce,
    WriteKick
}