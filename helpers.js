const bcrypt = require('bcrypt')
const cp = require('child_process')

const auth = function (req, res, next) {
    if (req.session && req.session.user === "admin" && req.session.admin) {
        return next();
    } else {
        return res.redirect('/login')
    }
};

const getHashedPassword = function (password) {
    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds);
    return hash;
};

const exec = (cmd) => new Promise((resolve, reject) => {
    cp.exec(cmd, (err, stdout, stderr) => {
        if (err || stderr) reject(err || stderr)
        resolve(stdout)
    })
})


module.exports = {
    auth,
    getHashedPassword,
    exec
};