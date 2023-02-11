const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const app = express();
const helpers = require('./helpers');

const auth = function (req, res, next) {
  if (req.session && req.session.user === "admin" && req.session.admin) {
    return next();
  } else {
    return res.status(401).send('Unauthorized');
  }
};

const secret = crypto.randomBytes(64).toString('hex');

app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(session({
  secret: secret,
  resave: true,
  saveUninitialized: true
}));

app.get('/', (req, res) => {
  res.render('views/login');
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (username === 'admin') {
    const hashedPassword = helpers.getHashedPassword(process.env.SDM_PWD);
    if (bcrypt.compareSync(password, hashedPassword)) {
      req.session.user = 'admin';
      req.session.admin = true;
      res.redirect('/dashboard');
    } else {
      res.render('views/login', {
        error: 'Login failed'
      });
    }
  } else {
    res.render('views/login', {
      error: 'Login failed'
    });
  }
});

app.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/');
});

app.get('/dashboard', auth, function (req, res) {
  res.render('views/dashboard');
});

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});