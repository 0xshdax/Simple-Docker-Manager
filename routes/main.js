const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const router = express.Router();

const auth = function(req, res, next) {
  if (req.session && req.session.user === "admin" && req.session.admin) {
    return next();
  } else {
    return res.status(401).send('Unauthorized');
  }
};

const ADMIN_PASSWORD = '0xshdax';

router.use(express.static(path.join(__dirname, '../assets')));

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));

router.use(session({
  secret: '93ZSBB0-0xshdax',
  resave: true,
  saveUninitialized: true
}));

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views', 'login.html'));
});

router.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (username === 'admin' && password === ADMIN_PASSWORD) {
    req.session.user = 'admin';
    req.session.admin = true;
    res.redirect('/dashboard');
  } else {
    res.send('Login failed');
  }
});

router.get('/logout', function(req, res) {
  req.session.destroy();
  res.send("logout success!");
});

router.get('/dashboard', auth, function(req, res) {
  res.sendFile(path.join(__dirname, '../views', 'dashboard.html'));
});

module.exports = router;
