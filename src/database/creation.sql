-- REFERENCE:
-- - `./aws-rds.spec.ts`

-- Table Definition ----------------------------------------------

CREATE TYPE txn_status_enum AS ENUM ('DOING_INITIALIZE','DONE_INITIALIZE','ERR_SEVER_INTERNAL','ERR_AWS_RDS_DB','DOING_INCOMING','ERR_TIMEOUT_INCOMING','ERR_VERIFY_INCOMING','DONE_INCOMING','ERR_MAKE_OUTGOING','DOING_OUTGOING','DOING_VERIFY','ERR_TIMEOUT_OUTGOING','DONE_OUTGOING','USER_CONFIRMED');

CREATE TABLE mint_request (
    db_id SERIAL PRIMARY KEY,
    txn_status txn_status_enum NOT NULL, 
    create_time bigint NOT NULL,
    fixed_fee_atom bigint NOT NULL,
    from_addr character varying(58) NOT NULL,
    from_amount_atom bigint NOT NULL,
    from_txn_id character varying(63) NOT NULL,
    margin_fee_atom bigint NOT NULL,
    to_addr character varying(64) NOT NULL,
    to_amount_atom bigint NOT NULL,
    to_txn_id character varying(63)
);
COMMENT ON COLUMN mint_request.from_addr IS 'near addr. max==64. from https://docs.near.org/docs/concepts/account#implicit-accountsMore than 64 characters (including .testnet) from https://wallet.testnet.near.org/create';
COMMENT ON COLUMN mint_request.to_addr IS 'algo addr. all algorand ==58 https://developer.algorand.org/docs/get-details/accounts/#keys-and-addresses';
COMMENT ON COLUMN mint_request.from_amount_atom IS 'of unit 10^-10 goNEAR.';
COMMENT ON COLUMN mint_request.create_time IS 'int, in millisecond';
COMMENT ON COLUMN mint_request.txn_status IS 'should use request_status ENUM';
COMMENT ON COLUMN mint_request.from_txn_id IS 'checked always 44, but not sure. (seems  32 bytes in base58) using 63.';
COMMENT ON COLUMN mint_request.to_txn_id IS 'checked always 52, but not sure. using 63. 32 bytes https://developer.algorand.org/docs/get-details/dapps/avm/teal/specification/#loading-values not in base 58, full caps. so its longer.';

-- Indices -------------------------------------------------------

-- CREATE UNIQUE INDEX mint_request_pkey ON mint_request(id int4_ops);
