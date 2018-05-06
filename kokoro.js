const fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

process.on('uncaughtException', (err) => {
  console.error(err);
});

if(!fs.existsSync('./config.js')) {
  fs.createReadStream('./config_example.js').pipe(fs.createWriteStream('./config.js'));
  console.log('Whoops! you forgot to copy your config file! i done that for you. so please just edit config.js else you\'ll get a lot of errors.')
  setTimeout(() => {
    process.exit(0)
  }, 500);
} else {
  require('./server')
}
