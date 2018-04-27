const OsuBuffer = require('../../main_modules/osu-buffer');
const config = require('../../config')
const crypto = require('crypto'),
    algorithm = 'aes-128-cbc'
    

function encrypt(data, iv, privatekey) {
    let cipher = crypto.createCipheriv(algorithm, privatekey, iv);
    let Crypted = cipher.update(data, 'utf8', 'hex');
    Crypted += cipher.final('hex');
    return new Buffer(Crypted, 'hex');
}

function decrypt(rawData, iv, privatekey) {
    let decipher = crypto.createDecipheriv(algorithm, privatekey, iv);
    let Decrypted = decipher.update(rawData, 'hex', 'utf8');
    Decrypted += decipher.final('utf8');
    return Decrypted;
}

function Write(Data = {PacketID, PacketData}, Type) {
    const buff = new OsuBuffer;
    const PacketData = JSON.stringify(Data.PacketData);
    const rewriteprivatekey = rewriteKey(config.EventHandler.PrivateKey);
    const privatekey = rewriteprivatekey.key;
    const privatekeyrandombytes = rewriteprivatekey.randombytes;
    const IV = CreateIV();
    const encrypted = encrypt(PacketData, IV, privatekey);
    switch (Type) {
        case 'Packet':
            buff.WriteUInt16(Data.PacketID);
            buff.WriteUInt16(IV.length);
            buff.WriteBuffer(IV);
            buff.WriteOsuString(privatekeyrandombytes, false);
            buff.WriteUInt16(encrypted.length);
            buff.WriteBuffer(encrypted);
            break;
        default:
            break;
    }
    return buff.buffer;
}

function Read(rawData, Type) {
    const buff = new OsuBuffer(rawData);
    let Data = {};
    switch (Type) {
        case 'Packet':
            buff.ReadUInt16();
            let PacketID = buff.ReadUInt16();
            let IVLength = buff.ReadUInt16();
            let IV = buff.Slice(IVLength, false);
            let privatekeyrandombytes = buff.ReadOsuString();
            let EncryptedLength = buff.ReadUInt16();
            let encrypted = buff.Slice(EncryptedLength, false);
            let convertedkey = new Buffer(config.EventHandler.PrivateKey+privatekeyrandombytes).slice(0, 16);
            let decrypted = decrypt(encrypted, IV, convertedkey)
            Data = {
                PacketID,
                PacketData: JSON.parse(decrypted),
            }
            break;
        default:
            break;
    }
    return Data;
}

function WritePacket(Data = {PacketID, PacketData}) {
    return Buffer(Write(Data, 'Packet')).toString('base64');
}

function ReadPacket(rawPacket) {
    let readedPacket = Read(rawPacket, 'Packet');
    if(readedPacket)
        return {
            PacketID: readedPacket.PacketID,
            PacketData: readedPacket.PacketData
        }
    else return {
        PacketID: 0,
        PacketData: {}
    }
}

function length (Data) {
    return String(Data).length;
}

function rewriteKey(key) {
    let randombytes = crypto.pseudoRandomBytes(128).toString('hex');
    key = key+randombytes;
    let KeyBuffer = new Buffer(key);
    let SlicedKeybuffer = KeyBuffer.slice(0, 16);
    return {
        key: SlicedKeybuffer,
        randombytes: randombytes
    };
}

function CreateIV() {
    let pseudoBytes = crypto.pseudoRandomBytes(256);
    return pseudoBytes.slice(0, 16)
}

module.exports = {
    WritePacket,
    ReadPacket
}