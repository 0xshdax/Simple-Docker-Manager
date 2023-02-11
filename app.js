const express = require('express');
const mainRouter = require('./routes/main');

const app = express();

app.use('/', mainRouter);

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});
