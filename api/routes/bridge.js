const express = require('express');
const validate = require('jsonschema').validate;

const {pool, sql} = require('artificio-bridge-database/db');
const log = require('artificio-bridge-common/logger');

const txnRoute = express.Router();
txnRoute.route('/')
  .get(handleGetCall)
  .post(handlePostCall);
 
async function handleGetCall(req, res) {
  let params = req.query
  let v = validate(params, {
    "type": "object",
    "properties": {
      "id": {
        "type": "number"
      }
    },
    "required": ["id"],
    "additionalProperties": false
  })
  if (!v.valid) {
    return res.status(400).json({errors: v.errors.map(e => e.toString())});
  }

  let result
  try {
    result = await pool.query(sql.readRequest(params))
  } catch (err) {
    log.error(err)
    return res.status(500).json({msg: 'failed to query database'});
  }

  let row = result.rows[0];
  if (!row) {
    return res.status(404).json({msg: 'bridge transaction not exist'});
  }
  
  return res.json(row);
}
 
async function handlePostCall(req, res) {
  let params = req.body;
  let v = validate(params, {
    "type": "object",
    "properties": {
      "from_addr": {"type": "string"},
      "from_amount_atom": {
        "type": "string",
        "pattern": "^[0-9]+$"
      },
      "from_token_id": {"type": "number"},
      "from_txn_hash": {"type": "string"},
      "from_txn_hash_sig": {"type": "string"},
      "to_addr": {"type": "string"},
      "to_token_id": {"type": "number"},
      "comment": {"type": "string"}
    },
    "required": ["from_addr", "from_amount_atom", "from_token_id", "from_txn_hash", "from_txn_hash_sig", "to_addr", "to_token_id"],
    "additionalProperties": false
  })

  if (!v.valid) {
    return res.status(400).json({errors: v.errors.map(e => e.toString())});
  }
  if (!params.comment) {
    params.comment = null
  }
      
  let result;
  try {
    result = await pool.query(sql.createRequest(params))
  } catch (err) {
    // insertion rejected by database due to constraint does not satisfy

    // or it's a connection error
    log.error(err)
    return res.status(500).json({msg: 'failed to query database'});
  }

  let row = result.rows[0]
  if (!row) {
    log.crit('expected one row in createRequest return')
    return res.status(500).json({msg: 'server bug'});
  }

  return res.status(201).json(row)
}

module.exports = txnRoute;
