const request = require('request');
const url = require('urlencode');

function updater(req, res) {
    request.get("http://old.ppy.sh" + req.url, (e, r, b) => {
        if(e != null) {
            res.send("[]");
            return;
        }
        res.send(b);
    });
}

module.exports = updater;