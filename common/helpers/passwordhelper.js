const bcrypt = require('bcrypt-nodejs');

function check(passhash, hash) {
  return bcrypt.compareSync(hash, passhash);
}

function create(string) {
  return bcrypt.hashSync(string);
}

module.exports = {
  check: check,
  create: create
};