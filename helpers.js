const bcrypt = require('bcrypt')

exports.getHashedPassword = function (password) {
    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds);
    return hash;
};