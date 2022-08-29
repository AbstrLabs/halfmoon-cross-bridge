const express = require('express');
const validate = require('jsonschema').validate;
const {pool, sql} = require('artificio-bridge-database');
const log = require('artificio-bridge-common/logger');

const feesRouter = express.Router()
feesRouter.route('/')
    .get(readFee);

async function readFee(req, res) {
    let params = req.query
    let v = validate(params, {
        "type": "object",
        "properties": {
          "from_token_id": {
            "type": "number"
          },
          "to_token_id": {
            "type": "number"
          }
        },
        "required": ["from_token_id", "to_token_id"],
        "additionalProperties": false
    })
    if (!v.valid) {
        return res.status(400).json({errors: v.errors.map(e => e.toString())});
    }
    
    
    let result
    try {
      result = await pool.query(sql.readTokenAndFee(params))
    } catch (err) {
      log.error(err)
      return res.status(500).json({msg: 'failed to query database'});
    }
    return res.json(result.rows)
}

module.exports = feesRouter