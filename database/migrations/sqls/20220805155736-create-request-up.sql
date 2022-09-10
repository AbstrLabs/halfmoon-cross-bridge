CREATE TYPE request_status_enum AS ENUM (
  'CREATED',
  'INVALID',
  'DONE_VERIFY',
  'ERROR_IN_VERIFY',
  'DOING_OUTGOING',
  'DONE_OUTGOING',
  'ERROR_IN_OUTGOING'
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
  atoms INTEGER NOT NULL,
  UNIQUE(name, blockchain)
);
COMMENT ON COLUMN token.addr IS 'if null, it means the native token of the blockchain';
CREATE UNIQUE INDEX only_one_native_token_each_chain ON token (blockchain, (addr IS NULL)) WHERE addr IS NULL;

CREATE TABLE fee (
  from_token_id INT REFERENCES token,
  to_token_id INT REFERENCES token CHECK(to_token_id <> from_token_id),
  bridge_type bridge_type_enum NOT NULL,
  fixed_fee_atom DECIMAL NOT NULL,
  margin_fee_atom DECIMAL NOT NULL,
  PRIMARY KEY (from_token_id, to_token_id)
);

CREATE TABLE request (
  id SERIAL PRIMARY KEY,
  request_status request_status_enum NOT NULL DEFAULT 'CREATED', 
  from_addr VARCHAR(255) NOT NULL,
  from_amount_atom DECIMAL NOT NULL,
  from_token_id INT NOT NULL REFERENCES token,
  from_txn_hash VARCHAR(255) NOT NULL UNIQUE,
  to_addr VARCHAR(255) NOT NULL,
  to_amount_atom DECIMAL,
  to_token_id INT NOT NULL REFERENCES token CHECK(to_token_id <> from_token_id),
  to_txn_bytes BYTEA, 
  to_txn_hash VARCHAR(255),
  created_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  comment VARCHAR(255),
  invalid_reason VARCHAR(255),
  err_msg VARCHAR(255)
);

CREATE INDEX index_request_from_txn_hash ON request (from_txn_hash);
CREATE INDEX index_request_from_addr ON request (from_addr);
CREATE INDEX index_request_to_addr ON request (to_addr);
