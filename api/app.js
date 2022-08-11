const express = require('express');
const cors = require('cors');
const bridgeRoute = require('./routes/bridge').bridgeRoute;
const statusRoute = require('./routes/status').statusRoute;
const log = require('artificio-bridge-common/logger')

export const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/bridge', bridgeRoute);
app.use('/status', statusRoute);
app.use('/tokens', tokensRoute);
app.use('/', (_req, res) => {
  return res.status(404).end('404 Not found');
});

app.listen(process.env.PORT, () => {
  log.info(`Bridge API started on http://localhost:${process.env.PORT}/`)
});
