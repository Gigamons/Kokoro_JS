const MySQL = require('mysql');
const sqlstring = require('sqlstring');

const fs = require('fs');
const path = require('path');

try {
    createConfig();
} catch (ex){
    console.error(ex);
}
const config = require(path.join(__dirname+'/../../config'));
const logger = require(path.join(__dirname+'/../helpers/logger'));

const pool = MySQL.createPool({
    connectionLimit: config.mysql.pool,
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.username,
    password: config.mysql.password,
    database: config.mysql.database
});

async function query(sql, ...param) {
    return new Promise((resolve, reject) => {
        pool.getConnection((err, con) => {
            if(err) {
                reject(err); 
                con.release();
            }
            else {
                con.query(sqlstring.format(sql, param), (err, result) => {
                    if(err){
                        reject(err);
                        con.release();
                    }
                    else {
                        resolve(result);
                        con.release();
                    };
                });
            }
        });
    })
}

module.exports = {
    query
};


function createConfig() {
    if(!fs.existsSync(path.join(__dirname+'/../../config.js'))){
        fs.writeFileSync(path.join(__dirname+'/../../config.js'), 
`module.exports = {
    mysql: {
        host: "localhost",
        port: 3306,
        username: "root",
        password: "",
        database: "bananacho"
    }
}`);
        console.log('Config created, please edit!');
        process.exit(0);
    }
}