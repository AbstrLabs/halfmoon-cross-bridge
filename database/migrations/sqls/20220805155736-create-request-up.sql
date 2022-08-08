CREATE TYPE txn_status_enum AS ENUM (
  'ERR_SERVER_INTERNAL',
  'ERR_AWS_RDS_DB',
  'DOING_INITIALIZE',
  'DONE_INITIALIZE',
  'ERR_INITIALIZE',
  'DOING_INCOMING',
  'ERR_VERIFY_INCOMING',
  'ERR_TIMEOUT_INCOMING',
  'DONE_INCOMING',
  'ERR_MAKE_OUTGOING',
  'DOING_OUTGOING',
  'DOING_VERIFY',
  'ERR_CONFIRM_OUTGOING',
  'DONE_OUTGOING',
  'USER_CONFIRMED'
);

CREATE TYPE txn_type_enum AS ENUM (
  'MINT',
  'BURN'
);

CREATE TABLE request (
  db_id SERIAL PRIMARY KEY,
  txn_status txn_status_enum NOT NULL, 
  from_addr VARCHAR(63) NOT NULL,
  from_amount_atom BIGINT NOT NULL,
  from_token_id VARCHAR(7) NOT NULL,
  from_txn_id VARCHAR(63) NOT NULL UNIQUE,
  to_addr VARCHAR(63) NOT NULL,
  to_amount_atom BIGINT NOT NULL,
  to_token_id VARCHAR(7) NOT NULL,
  to_txn_id VARCHAR(63),
  created_time BIGINT NOT NULL,
  txn_comment VARCHAR(255),
  fixed_fee_atom BIGINT NOT NULL,
  margin_fee_atom BIGINT NOT NULL
);

CREATE INDEX index_request_from_txn_id ON request (from_txn_id);
CREATE INDEX index_request_from_addr ON request (from_addr);
CREATE INDEX index_request_to_addr ON request (to_addr);

COMMENT ON COLUMN request.from_addr IS 'near/algo addr. max==64. near: <=64 https://docs.near.org/docs/concepts/account#implicit-accountsMore than 64 characters (including .testnet) from https://wallet.testnet.near.org/create';
COMMENT ON COLUMN request.to_addr IS 'near/algo addr. max==64. algo: ==58 https://developer.algorand.org/docs/get-details/accounts/#keys-and-addresses';
COMMENT ON COLUMN request.from_amount_atom IS 'of unit 10^-10 goNEAR.';
COMMENT ON COLUMN request.created_time IS 'int, in millisecond';
COMMENT ON COLUMN request.txn_status IS 'should use request_status ENUM';
COMMENT ON COLUMN request.from_txn_id IS 'checked always 44, but not sure. (seems  32 bytes in base58) using 63.';
COMMENT ON COLUMN request.to_txn_id IS 'checked always 52, but not sure. using 63. 32 bytes https://developer.algorand.org/docs/get-details/dapps/avm/teal/specification/#loading-values not in base 58, full caps. so its longer.';
