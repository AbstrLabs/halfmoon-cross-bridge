const express = require('express');
const {pool, sql} = require('artificio-bridge-database');
const log = require('artificio-bridge-common/logger');

const tokensRouter = express.Router()
tokensRouter.route('/')
    .get(readTokens);

async function readTokens(_req, res) {
    let result
    try {
      result = await pool.query(sql.readTokens())
    } catch (err) {
      log.error(err)
      return res.status(500).json({msg: 'failed to query database'});
    }
    return res.json(result.rows)
}

module.exports = tokensRouter