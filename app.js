const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const helpers = require('./helpers');

const secret = crypto.randomBytes(64).toString('hex');
const port = process.env.PORT || 3000;

app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret, resave: true, saveUninitialized: true }));

app.get('/login', (req, res) => {
  if (req.session.admin === true) {
    res.redirect('/');
  } else {
    res.render('views/login');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin') {
    const hashedPassword = await bcrypt.hash(process.env.SDM_PWD, 10);
    if (await bcrypt.compare(password, hashedPassword)) {
      req.session.user = 'admin';
      req.session.admin = true;
      res.redirect('/');
    } else {
      res.render('views/login', { error: 'Login failed' });
    }
  } else {
    res.render('views/login', { error: 'Login failed' });
  }
});

app.get('/', helpers.auth, async (req, res) => {
  if (req.session.admin === true) {
    try {
      let containerData = await helpers.exec('docker ps --format "{{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.Names}}"');
  
      setInterval(async () => {
        const updatedOutput = await helpers.exec('docker ps --format "{{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.Names}}"');
        if (updatedOutput !== containerData) {
          containerData = updatedOutput;
          io.emit('containerUpdate', containerData);
        }
      }, 10000);
      
      io.setMaxListeners(20);
      io.on('connection', (socket) => {
        socket.emit('containerUpdate', containerData);
      });
  
      res.render('views/dashboard', { containerData });
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred');
    }
  } else {
    res.render('views/login');
  }
});

app.get('/about', helpers.auth, async (req, res) => {
  res.render('views/about');
});

app.post('/stop-container', helpers.auth, async (req, res) => {
  const containerId = req.params.containerId;
  try {
    if (!/^[a-f0-9]{12}$/.test(containerId)) {
      res.status(500).send('An error occurred');
    }
    await helpers.exec(['docker', 'stop', containerId]);
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});