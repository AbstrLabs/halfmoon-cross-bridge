CREATE TABLE request_dev (
    db_id SERIAL PRIMARY KEY,
    txn_status txn_status_enum NOT NULL, 
    created_time BIGINT NOT NULL,
    from_addr VARCHAR(63) NOT NULL,
    from_amount_atom BIGINT NOT NULL,
    from_token_id SMALLINT NOT NULL,
    from_txn_id VARCHAR(63) NOT NULL,
    to_addr VARCHAR(63) NOT NULL,
    to_amount_atom BIGINT NOT NULL,
    to_token_id SMALLINT NOT NULL,
    to_txn_id VARCHAR(63)
    fixed_fee_atom BIGINT NOT NULL,
    margin_fee_atom BIGINT NOT NULL,
);

-- COMMENTS

COMMENT ON COLUMN request_dev.from_addr IS 'near/algo addr. max==64. near: <=64 https://docs.near.org/docs/concepts/account#implicit-accountsMore than 64 characters (including .testnet) from https://wallet.testnet.near.org/create';
COMMENT ON COLUMN request_dev.to_addr IS 'near/algo addr. max==64. algo: ==58 https://developer.algorand.org/docs/get-details/accounts/#keys-and-addresses';
COMMENT ON COLUMN request_dev.from_amount_atom IS 'of unit 10^-10 goNEAR.';
COMMENT ON COLUMN request_dev.created_time IS 'int, in millisecond';
COMMENT ON COLUMN request_dev.txn_status IS 'should use request_status ENUM';
COMMENT ON COLUMN request_dev.from_txn_id IS 'checked always 44, but not sure. (seems  32 bytes in base58) using 63.';
COMMENT ON COLUMN request_dev.to_txn_id IS 'checked always 52, but not sure. using 63. 32 bytes https://developer.algorand.org/docs/get-details/dapps/avm/teal/specification/#loading-values not in base 58, full caps. so its longer.';

-- INDEX

CREATE INDEX txn_status_index ON request_dev(txn_status);
