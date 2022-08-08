-- createRequest
INSERT INTO request 
(
  from_addr, from_amount_atom, from_token_id, from_txn_id,
  to_addr, to_amount_atom, to_token_id, to_txn_id,
  created_time, fixed_fee_atom, margin_fee_atom,
  txn_comment
)
VALUES (
  :from_addr, :from_amount_atom, :from_token_id, :from_txn_id,
  :to_addr, :to_amount_atom, :to_token_id, :to_txn_id,
  :created_time, :fixed_fee_atom, :margin_fee_atom,
  :txn_comment
)
RETURNING db_id;

-- readRequest
SELECT * FROM request WHERE db_id = :db_id;

-- readRequests
SELECT * FROM request ORDER_BY db_id LIMIT :n OFFSET :start;

-- updateRequest
UPDATE request SET
  txn_status=:txn_status, to_txn_id = :to_txn_id
    WHERE (
      db_id=:db_id
    )
RETURNING db_id;

-- readRequestByFromTxnId
SELECT * FROM request WHERE from_txn_id = :from_txn_id;


-- deleteRequest
DELETE FROM ${this.requestTableName} WHERE db_id = :db_id;
