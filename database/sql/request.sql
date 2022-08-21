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

-- updateRequestCreatedToInvalid
UPDATE request SET
  request_status='INVALID', invalid_reason=:reason
    WHERE (
      id=:id,
      status='CREATED'
    )
RETURNING id;

-- updateRequestCreatedToDoneVerify
UPDATE request SET
  request_status='DONE_VERIFY'
    WHERE (
      id=:id,
      status='CREATED'
    )
RETURNING id;

-- updateRequestCreatedToErrorInVerify
UPDATE request SET
  request_status='ERROR_IN_VERIFY', err_msg=:errorMsg
    WHERE (
      id=:id,
      status='CREATED'
    )
RETURNING id;

-- updateRequestDoneVerifyToDoingOutgoing
UPDATE request SET
  request_status='DOING_OUTGOING'
    WHERE (
      id=:id,
      status='DONE_VERIFY'
    )
RETURNING id;

-- updateRequestDoingOutgoingToDoneOutgoing
UPDATE request SET
  request_status='DONE_OUTGOING', to_txn_hash=:toTxnHash
    WHERE (
      id=:id,
      status='DOING_OUTGOING'
    )
RETURNING id;

-- updateRequestDoingOutgoingToErrorInOutgoing
UPDATE request SET
  request_status='DONE_OUTGOING', err_msg=:errorMsg
    WHERE (
      id=:id,
      status='DOING_OUTGOING'
    )
RETURNING id;

-- readRequestToProcess
SELECT * FROM request WHERE request_status='CREATED' OR request_status='DONE_VERIFY' OR request_status='DOING_OUTGOING' FOR UPDATE SKIP LOCKED LIMIT 1;

-- readRequestByFromTxnId
SELECT * FROM request WHERE from_txn_hash = :from_txn_hash;

-- deleteRequest
DELETE FROM request WHERE id = :id;

-- deleteAllRequests
DELETE FROM request;

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
from_token_id = :from_token_id AND to_token_id = :to_token_id;
