const redis = require('redis');
const utils = require('util');
const bluebird = require('bluebird')

const logger = require('../helpers/logger');
const config = require('../../config');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

let conf = {
    retry_strategy: function (options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with
            // a individual error
            return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands
            // with a individual error
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 100, 3000);
    },
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password
}

if(conf.password.length < 1){
	delete conf.password;
}

const client = redis.createClient(conf);

client.on('connect', () => {
    logger.success('Redis connected successfully!%s'.red);
});

client.on("error", function (err) {
    logger.error('Redis ERROR! '+err);
});


module.exports = client;