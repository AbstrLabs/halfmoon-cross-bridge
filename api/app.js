const express = require('express');
const cors = require('cors');
const bridgeRoute = require('./routes/bridge');
const statusRoute = require('./routes/status');
const tokensRoute = require('./routes/tokens')
const log = require('artificio-bridge-common/logger')

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/bridge', bridgeRoute);
app.use('/status', statusRoute);
app.use('/tokens', tokensRoute);
app.use('/', (_req, res) => {
  return res.status(404).end('404 Not found');
});

const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4190;
app.listen(port, () => {
  log.info(`Bridge API started on http://localhost:${port}/`)
});
