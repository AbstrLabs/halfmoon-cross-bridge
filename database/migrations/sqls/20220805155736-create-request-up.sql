CREATE TYPE request_status_enum AS ENUM (
  'CREATED',
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

CREATE TYPE bridge_type_enum AS ENUM (
  'MINT',
  'BURN'
);

CREATE TYPE blockchain_enum AS ENUM (
  'Algorand',
  'NEAR'
);

CREATE TABLE token (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  blockchain blockchain_enum NOT NULL,
  addr VARCHAR(63),
  UNIQUE(name, blockchain)
);
CREATE UNIQUE INDEX only_one_native_token_each_chain ON token (blockchain, (addr IS NULL)) WHERE addr IS NULL;

CREATE TABLE fee (
  from_token_id INT REFERENCES token,
  to_token_id INT REFERENCES token CHECK(to_token_id <> from_token_id),
  bridge_type bridge_type_enum NOT NULL,
  fixed_fee_atom BIGINT NOT NULL,
  margin_fee_atom BIGINT NOT NULL,
  PRIMARY KEY (from_token_id, to_token_id)
);

COMMENT ON COLUMN token.addr IS 'if null, it means the native token of the blockchain';

CREATE TABLE request (
  id SERIAL PRIMARY KEY,
  request_status request_status_enum NOT NULL DEFAULT 'CREATED', 
  from_addr VARCHAR(63) NOT NULL,
  from_amount_atom BIGINT NOT NULL,
  from_token_id INT NOT NULL REFERENCES token,
  from_txn_hash VARCHAR(63) NOT NULL UNIQUE,
  to_addr VARCHAR(63) NOT NULL,
  to_amount_atom BIGINT NOT NULL,
  to_token_id INT NOT NULL REFERENCES token,
  to_txn_hash VARCHAR(63),
  created_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  comment VARCHAR(255)
);

CREATE INDEX index_request_from_txn_hash ON request (from_txn_hash);
CREATE INDEX index_request_from_addr ON request (from_addr);
CREATE INDEX index_request_to_addr ON request (to_addr);

COMMENT ON COLUMN request.from_addr IS 'near/algo addr. max==64. near: <=64 https://docs.near.org/docs/concepts/account#implicit-accountsMore than 64 characters (including .testnet) from https://wallet.testnet.near.org/create';
COMMENT ON COLUMN request.to_addr IS 'near/algo addr. max==64. algo: ==58 https://developer.algorand.org/docs/get-details/accounts/#keys-and-addresses';
COMMENT ON COLUMN request.from_amount_atom IS 'of unit 10^-10 goNEAR.';
COMMENT ON COLUMN request.request_status IS 'should use request_status ENUM';
COMMENT ON COLUMN request.from_txn_hash IS 'checked always 44, but not sure. (seems  32 bytes in base58) using 63.';
COMMENT ON COLUMN request.to_txn_hash IS 'checked always 52, but not sure. using 63. 32 bytes https://developer.algorand.org/docs/get-details/dapps/avm/teal/specification/#loading-values not in base 58, full caps. so its longer.';