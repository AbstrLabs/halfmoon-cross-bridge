const express = require("express");
const validate = require("jsonschema").validate;

const { pool, sql } = require("halfmoon-cross-bridge-database");
const log = require("halfmoon-cross-bridge-common/logger");
const { unreachable } = require("../utils");

const txnRoute = express.Router();
txnRoute.route("/").get(handleGetCall).post(handlePostCall);

async function handleGetCall(req, res) {
    let params = req.query;
    let v = validate(params, {
        type: "object",
        properties: {
            id: {
                type: "number",
            },
        },
        required: ["id"],
        additionalProperties: false,
    });
    if (!v.valid) {
        return res.status(400).json({ errors: v.errors.map((e) => e.toString()) });
    }

    let result;
    try {
        result = await pool.query(sql.readRequest(params));
    } catch (err) {
        log.error(err);
        return res.status(500).json({ msg: "failed to query database" });
    }

    let row = result.rows[0];
    if (!row) {
        return res.status(404).json({ msg: "bridge transaction not exist" });
    }

    return res.json(row);
}

async function handlePostCall(req, res) {
    let params = req.body;
    let v = validate(params, {
        type: "object",
        properties: {
            from_addr: { type: "string" },
            from_token_id: { type: "number" },
            from_txn_hash: { type: "string", pattern: "^[a-zA-Z0-9]+$" },
            to_token_id: { type: "number" },
            comment: { type: "string" },
        },
        required: ["from_addr", "from_token_id", "from_txn_hash", "to_token_id"],
        additionalProperties: false,
    });

    if (!v.valid) {
        return res.status(400).json({
            errors: v.errors.map((e) => {
                let msg = e.toString();
                if (msg.startsWith("instance.from_txn_hash does not match pattern")) {
                    return "from_txn_hash is invalid";
                }
                return msg;
            }),
        });
    }
    if (!params.comment) {
        params.comment = null;
    }

    let result;
    try {
        result = await pool.query(sql.createRequest(params));
    } catch (err) {
        // insertion rejected by database due to constraint does not satisfy
        if (err.code == "23505") {
            if (err.constraint == "request_from_txn_hash_key") {
                return res.status(400).json({ msg: "duplicate transaction" });
            }
            unreachable();
        } else if (err.code == "23514") {
            if (err.constraint == "request_check") {
                return res.status(400).json({ msg: "from_token and to_token must be different" });
            }
            unreachable();
        }
        // or it's a connection error
        log.error(err);
        return res.status(500).json({ msg: "failed to query database" });
    }

    let row = result.rows[0];
    if (!row) {
        log.crit("expected one row in createRequest return");
        return res.status(500).json({ msg: "server bug" });
    }

    return res.status(201).json(row);
}

module.exports = txnRoute;
