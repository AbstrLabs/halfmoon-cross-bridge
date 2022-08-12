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
COMMENT ON COLUMN token.addr IS 'if null, it means the native token of the blockchain';
CREATE UNIQUE INDEX only_one_native_token_each_chain ON token (blockchain, (addr IS NULL)) WHERE addr IS NULL;

CREATE TABLE fee (
  from_token_id INT REFERENCES token,
  to_token_id INT REFERENCES token CHECK(to_token_id <> from_token_id),
  bridge_type bridge_type_enum NOT NULL,
  fixed_fee_atom BIGINT NOT NULL,
  margin_fee_atom BIGINT NOT NULL,
  PRIMARY KEY (from_token_id, to_token_id)
);


CREATE TABLE request (
  id SERIAL PRIMARY KEY,
  request_status request_status_enum NOT NULL DEFAULT 'CREATED', 
  from_addr VARCHAR(255) NOT NULL,
  from_amount_atom BIGINT NOT NULL,
  from_token_id INT NOT NULL REFERENCES token,
  from_txn_hash VARCHAR(255) NOT NULL,
-- prevent use other's from_txn_hash attack  
  from_txn_hash_sig VARCHAR(255) NOT NULL,
  to_addr VARCHAR(255) NOT NULL,
  to_amount_atom BIGINT,
  to_token_id INT NOT NULL REFERENCES token,
  to_txn_hash VARCHAR(255),
  created_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  comment VARCHAR(255),
  UNIQUE(from_txn_hash, from_txn_hash_sig)
);

CREATE INDEX index_request_from_txn_hash ON request (from_txn_hash);
CREATE INDEX index_request_from_addr ON request (from_addr);
CREATE INDEX index_request_to_addr ON request (to_addr);
