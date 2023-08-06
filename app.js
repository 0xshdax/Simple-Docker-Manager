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
    res.render('views/dashboard')
  } else {
    res.render('views/login');
  }
});

app.get('/containers-running', helpers.auth, async (req, res) => {
  try {
    let containerRun = await helpers.exec('docker ps --format "{{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.Names}}"');

    setInterval(async () => {
      const updatedRunOutput = await helpers.exec('docker ps --format "{{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.Names}}"');
      if (updatedRunOutput !== containerRun) {
        containerRun = updatedRunOutput;
        io.emit('updatedRunOutput', containerRun);
      }
    }, 10000);
    
    io.setMaxListeners(5);
    io.on('connection', (socket) => {
      socket.emit('updatedRunOutput', containerRun);
    });

    res.render('views/containers-running', { containerRun });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

app.get('/containers-stopped', helpers.auth, async (req, res) => {
  try {
    let containerStop = await helpers.exec('docker ps -a --filter status=exited --format "{{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.Names}}"');

    setInterval(async () => {
      const updatedStopOutput = await helpers.exec('docker ps -a --filter status=exited --format "{{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}\t{{.Names}}"');
      if (updatedStopOutput !== containerStop) {
        containerStop = updatedStopOutput;
        io.emit('updatedStopOutput', containerStop);
      }
    }, 10000);
    
    io.setMaxListeners(5);
    io.on('connection', (socket) => {
      socket.emit('updatedStopOutput', containerStop);
    });

    res.render('views/containers-stopped', { containerStop });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

app.get('/about', helpers.auth, async (req, res) => {
  res.render('views/about');
});

app.post('/stop-container', helpers.auth, async (req, res) => {
  const containerId = req.body.containerId;
  if (!/^[a-f0-9]{12}$/.test(containerId)) {
    return res.status(400).send('Invalid container ID format');
  }
  try {
    await helpers.exec(`docker stop ${containerId}`);
    res.redirect('/containers-running');
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