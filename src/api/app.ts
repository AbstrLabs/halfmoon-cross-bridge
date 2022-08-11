const express = require('express');
const cors = require('cors');
const ENV = require('../utils/env').ENV;
const txnRoute = require('./routes/txn').txnRoute;
const docsRoute = require('./routes/docs').docsRoute;
const statusRoute = require('./routes/status').statusRoute;
const log = require('../utils/log/log-template').log;

export const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(express.json()); // parse application/json

app.use('/', txnRoute);
app.use('/docs', docsRoute);
app.use('/status', statusRoute);
app.use('/', (_req, res) => {
  return res.status(404).end('404 Not found');
});

app.listen(ENV.PORT, () => {
  log.APIS.appStarted(ENV.PORT);
});

