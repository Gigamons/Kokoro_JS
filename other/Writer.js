const OsuBuffer = require('./osu-buffer');
const stream = require('stream');

let datatypes = {
    int8: 'int8',
    uint8: 'uint8',
    int16: 'int16',
    uint16: 'uint16',
    int32: 'int32',
    uint32: 'uint32',
    int64: 'int64',
    uint64: 'uint64',
    string: 'string',
    float: 'float',
    double: 'double',
    boolean: 'boolean',
    byte: 'byte',
    int32array: 'int32array',
    rawreplay: 'rawreplay'
}

function Write(o) {
    let buff = new OsuBuffer();
    switch (o[1]) {
        case 'int8':
            buff.WriteInt8(o[0]);
            break;
        case 'uint8':
            buff.WriteUInt8(o[0]);
            break;
        case 'int16':
            buff.WriteInt16(o[0]);
            break;
        case 'uint16':
            buff.WriteUInt16(o[0]);
            break;
        case 'int32':
            buff.WriteInt32(o[0]);
            break;
        case 'uint32':
            buff.WriteUInt32(o[0]);
            break;
        case 'int64':
            buff.WriteInt64(o[0]);
            break;
        case 'uint64':
            buff.WriteUInt64(o[0]);
            break;
        case 'string':
            buff.WriteOsuString(o[0], o[3]);
            break;
        case 'float':
            buff.WriteFloat(o[0]);
            break;
        case 'double':
            buff.WriteDouble(o[0]);
            break;
        case 'boolean':
            buff.WriteBoolean(o[0]);
            break;
        case 'byte':
            buff.WriteByte(o[0]);
            break;
        case 'int32array': {
            buff.WriteInt16(o[0].length);
            for (let i = 0; i < o[0].length; i++) {
                buff.WriteInt32(o[0][i]);
            }
            break;
        }
        case 'rawreplay': {
            return buff.WriteUInt16(o[0].length)
                    .WriteBuffer(o[0]).buffer;
            break;
        }
        case 'packet': {
            buff.WriteInt16(o[0].id)
                .WriteBoolean(false)
                .WriteUInt32(o[0].data.length)
                .WriteBuffer(o[0].data);
        }
    }
    return buff.buffer;
}

function Pack(arr = [], PacketID = 0) {
    let Stream = new stream.PassThrough;
    const buff = new OsuBuffer;
    for (let i = 0; i < arr.length; i++) {
        const element = Write(arr[i]);
        Stream.push(element);
    }
    if(PacketID > 0){
        const Packet = Write([
            {
                id: PacketID,
                data: Stream.read()
            },
            'packet'
        ]);
        return Packet;
    }
    return Stream.read();
}

module.exports = {
    datatypes,
    Write,
    Pack
};