const Router = require('express').Router;

const version = require('../package.json').version;

const STATUS_JSON = {
  API_VERSION: version,
  API_SERVER: 'https://api.halfmooncross.com/',
};

module.exports = Router().get('/', (_req, res) => {
  return res.json(STATUS_JSON);
});