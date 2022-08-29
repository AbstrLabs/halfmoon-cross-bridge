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
SELECT * FROM request ORDER BY id LIMIT :n OFFSET :start;

-- updateRequestCreatedToInvalid
UPDATE request SET
  request_status='INVALID', invalid_reason=:invalid_reason
    WHERE (
      id=:id,
      status='CREATED'
    )
RETURNING id;

-- updateRequestCreatedToDoneVerify
UPDATE request SET
  request_status='DONE_VERIFY', to_amount_atom=:to_amount_atom
    WHERE (
      id=:id,
      status='CREATED'
    )
RETURNING id;

-- updateRequestCreatedToErrorInVerify
UPDATE request SET
  request_status='ERROR_IN_VERIFY', err_msg=:err_msg
    WHERE (
      id=:id,
      status='CREATED'
    )
RETURNING id;

-- updateRequestDoneVerifyToDoingOutgoing
UPDATE request SET
  request_status='DOING_OUTGOING', to_txn_hash=:to_txn_hash, to_txn_bytes=:to_txn_bytes
    WHERE (
      id=:id,
      status='DONE_VERIFY'
    )
    WHERE (
      id=:id,
      status='DONE_VERIFY'
    )
RETURNING id;

-- updateRequestDoingOutgoingToDoneOutgoing
UPDATE request SET
  request_status='DONE_OUTGOING'
    WHERE (
      id=:id,
      status='DOING_OUTGOING'
    )
RETURNING id;

-- updateRequestDoingOutgoingToErrorInOutgoing
UPDATE request SET
  request_status='ERROR_IN_OUTGOING', err_msg=:err_msg
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
  name, blockchain, addr, atoms
)
VALUES (
  :name, :blockchain, :addr, :atoms
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

-- readTokenAndFee
select 
	from_token_id, from_token.name as from_token_name, from_token.blockchain as from_token_blockchain, from_token.addr as from_token_addr, from_token.atoms as from_token_atoms,
	to_token_id, to_token.name as to_token_name, to_token.blockchain as to_token_blockchain, to_token.addr as to_token_addr, to_token.atoms as to_token_atoms,
	bridge_type, fixed_fee_atom, margin_fee_atom
from fee 
	join token from_token on fee.from_token_id=from_token.id 
	join token to_token on fee.to_token_id=to_token.id 
	where from_token_id=:from_token_id and to_token_id=:to_token_id;
