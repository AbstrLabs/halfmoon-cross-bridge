const express = require('express');
const validate = require('jsonschema').validate;

const {pool, sql} = require('artificio-bridge-database/db');
const log = require('artificio-bridge-common/logger');

const txnRoute = express.Router();
txnRoute.route('/')
  .get(handleGetCall)
  .post(handlePostCall);
 
async function handleGetCall(req, res) {
  let param = req.query
  let v = validate(param, {
    "type": "object",
    "properties": {
      "id": "number"
    }
  })
  if (!v.valid) {
    return res.status(400).json({errors: v.errors.map(e => e.toString())});
  }

  let result
  try {
    result = await pool.query(sql.readRequest({id}))
  } catch (err) {
    log.error(err)
    return res.status(400).json({msg: 'failed to query database'});
  }

  let row
  try {
    row = result.rows[0]
  } catch (err) {
    return res.status(404).json({msg: 'bridge transaction not exist'});
  }
  
  return res.json(row);
}
 
async function handlePostCall(req, res) {
  let {from_addr, from_amount_atom, from_token_id, from_txn_hash, from_txn_hash_sig, to_addr, to_token_id, comment} = req.body;
    
  let result;
  try {
    await pool.query(sql.createRequest({from_addr, from_amount_atom, from_token_id, from_txn_hash, from_txn_hash_sig, to_addr, to_token_id, comment}))
  } catch (err) {

    // insertion rejected by database due to constraint does not satisfy

  }

  let row
  try {
    row = result.rows[0]
  } catch (err) {
    log.crit('expected one row in createRequest')
    return res.status(500).json({msg: 'server bug'});
  }
  return res.status(201).json(row)
}

module.exports = txnRoute;
