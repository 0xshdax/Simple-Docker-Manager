const bcrypt = require('bcrypt');

const auth = function (req, res, next) {
    if (req.session && req.session.user === "admin" && req.session.admin) {
        return next();
    } else {
        return res.status(401).send('Unauthorized');
    }
};

const getHashedPassword = function (password) {
    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds);
    return hash;
};

module.exports = {
    auth,
    getHashedPassword,
};