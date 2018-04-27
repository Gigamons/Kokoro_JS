const urlencode = require('urlencode');
/**
 * @param {"fokabotMessage"} pref,
 * @param {"https://c.bananacho.ml/api/v1"} c,
 * @param {null} key,
 * @param {["to", "msg"]} cont,
 * @param {["#osu", "LOL I I'M GOD!"]} val,
 * @returns {string}
 */
function builder (c, pref, cont, val, key){
    let con;
    let l = '';
    for (let i = 0, len = cont.length; i < len; i++) {
        if(val[i] == undefined || val[i] == null){
            val[i] = '';
        }
        if(cont[i] != undefined || cont[i] != null){
            con += '&'+urlencode(cont[i])+'=';
            con += urlencode(val[i]);
        }
    }
    let pr = urlencode(pref);
    let k = urlencode(key);
    if(k == 'undefined' || k == 'null') k = '';
    let url = c+pr+'?k='+k+con;
    let u = url.split('undefined');
    for (let i = 0, len = u.length; i < len; i++) {
        if(u[i] != "undefined") l += u[i];
    }
    return l;
}

module.exports = {
    builder
};