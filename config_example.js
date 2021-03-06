module.exports = {
    server: {
        port: 5002,
        apikey: '',
        debug: false
    },
    cheesegull: {
        api: 'http://storage.gigamons.de/api',
        download: 'http://storage.gigamons.de/d'
    },
	Kokoro: {
        WebSideURI: 'gigamons.de',
        websideurl: 'https://gigamons.de',
        everythingisranked: false
    },
    osu: {
        apikey: ''
    },
    mysql: {
        pool: 2,
        host: '127.0.0.1',
        port: 3306,
        username: 'root',
        password: '',
        database: 'gigamons'
    },
    redis: {
        host: '127.0.0.1',
        port: 6379,
        password: ''
    }
};