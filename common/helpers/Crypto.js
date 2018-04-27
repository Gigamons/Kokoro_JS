const crypto = require('crypto');

function md5String(string) {
    return crypto.createHash('MD5').update(string).digest().toString('hex');
}

function md5File(File = new Buffer('')) {
    let stringFile = File.toString();
    if(stringFile.length > 0) 
            return md5String(stringFile);
    else return '';
}

function hashedString(string, method) {
    return crypto.createHash(method).update(string).digest().toString('hex');
}

module.exports = {
    md5String,
    md5File,
    hashedString
}