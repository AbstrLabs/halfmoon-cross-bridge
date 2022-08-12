-- createRequest
INSERT INTO request 
(
  from_addr, from_amount_atom, from_token_id, from_txn_hash, from_txn_hash_sig, 
  to_addr, to_token_id, 
  comment
)
VALUES (
  :from_addr, :from_amount_atom, :from_token_id, :from_txn_hash, :from_txn_hash_sig,
  :to_addr, :to_token_id,
  :comment
)
RETURNING id;

-- readRequest
SELECT * FROM request WHERE id = :id;

-- readRequests
SELECT * FROM request ORDER_BY id LIMIT :n OFFSET :start;

-- updateRequest
UPDATE request SET
  request_status=:request_status, to_txn_hash = :to_txn_hash
    WHERE (
      id=:id
    )
RETURNING id;

-- readRequestByFromTxnId
SELECT * FROM request WHERE from_txn_hash = :from_txn_hash;

-- deleteRequest
DELETE FROM ${this.requestTableName} WHERE id = :id;

-- createToken
INSERT INTO token
(
  name, blockchain, addr
)
VALUES (
  :name, :blockchain, :addr
)
RETURNING id;

-- readTokens
SELECT * FROM token;

-- createFee
INSERT INTO fee
(
  from_token_id, to_token_id, bridge_type, fixed_fee_atom, margin_fee_atom
)
VALUES (
  :from_token_id, :to_token_id, :bridge_type, :fixed_fee_atom, :margin_fee_atom
);

-- readFee
SELECT * FROM fee WHERE
(
  from_token_id, to_token_id
)
VALUES (
  :from_token_id, :to_token_id
);
