const express = require('express');
const {pool, sql} = require('artificio-bridge-database/db');
const log = require('artificio-bridge-common/logger');

const feesRouter = express.Router()
feesRouter.route('/')
    .get(readFee);

async function readFee(req, res) {
    let {from_token_id, to_token_id} = req.body;

    let result
    try {
      result = await pool.query(sql.readFee({from_token_id, to_token_id}))
    } catch (err) {
      log.error(err)
      return res.status(400).json({msg: 'failed to query database'});
    }
    return res.json(result.rows)
}

module.exports = tokensRouter