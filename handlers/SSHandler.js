let fs = require('fs');
const readChunk = require('read-chunk');
const fileType = require('file-type');
const config = require('../config');
const MD5File = require('../common').Crypto.md5File;
const bluebird = require('bluebird');
const { join } = require('path');

bluebird.promisifyAll(fs);

function get(req) {
    const id = req.url.split("/ss/")[1];
    const path = join(__dirname + '/../files/ss/'+id);

    if(fs.existsSync(path)){
        const buffer = readChunk.sync(path, 0, 4100);
        let m = fileType(buffer);
        return {
            statusCode: 200,
            MimeType: m.mime,
            output: fs.readFileSync(path)
        }
    } else {
        return {
            statusCode: 404,
            MimeType: 'text/html',
            output: 'File not Found!'
        }
    }
}

async function set(req) {
    let filename = req.file.filename
    let path = join(__dirname+'/../'+req.file.path)

    const buffer = readChunk.sync(path, 0, 4100);
    const file = fs.readFileSync(path);
    let m = fileType(buffer);
    // Save it as PNG or JPG
    let FileHash = MD5File(file);
    let ShortFileHash = FileHash.substring(0, 8);
    console.log(ShortFileHash);
    switch (m.ext) {
        case 'png': break;
        case 'jpg': break;
        default:
            await fs.unlinkAsync(path);
            return {
                statusCode: 403,
                output: 'no, just no, you cant upload a '+m.ext+'btw, you can\'t even upload anything without osu!'
            }
            break;
    }
    try {
        await rename(path, join(__dirname+'/../files/ss/'+ShortFileHash));
        return {
            statusCode: 200,
            output: config.Kokoro.websideurl + "/ss/" + ShortFileHash
        }
    } catch (ex) {
        console.log(ex);
        await fs.unlinkAsync(path);
        return {
            statusCode: 408,
            output: ex.toString()
        }
    }
}

let rename = async (path, to) =>{
    return new Promise( (resolve, reject) => {
        fs.rename(path, to, (err) => {
            if(err) reject(err);
            else resolve(true);
        });
    });
}

module.exports = {
    get,
    set
}