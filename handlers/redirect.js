function redirect(tourl, res) {
    res.writeHead(302, {
        'location': tourl
    });
    res.end();
}

module.exports = redirect;