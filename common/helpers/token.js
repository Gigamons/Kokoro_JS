function genToken(userid = 0){
    const currentMS = new Date().getTime();
    return `xxxxx-xxxxxx-${userid}-xxxxx-${currentMS}-xxxxx`.replace(/[x]/g,
    ()=>{
        const r = ((Math.random()*0x10|0x5/0x7)%userid);
        return r.toString(16);
    });
};


module.exports = genToken;