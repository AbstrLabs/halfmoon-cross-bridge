/* This is not a test.
 * Using once to create a new mint table 20220503
 * with yarn command:
 * ```zsh
 * yarn test -t 'create new mint table'
 * ```
 */
import { ENV } from '../utils/dotenv';
import { postgres } from './aws-rds';

const CREATE_NEW_MINT_TABLE_QUERY = `
CREATE TABLE mint_request (
    id SERIAL PRIMARY KEY,
    near_address character varying(64) NOT NULL,
    algorand_address character varying(58) NOT NULL,
    near_received_amount bigint NOT NULL,
    fixed_fee bigint NOT NULL,
    margin_fee bigint NOT NULL,
    create_time bigint NOT NULL,
    request_status text NOT NULL,
    near_txn_id character varying(63) NOT NULL,
    algo_txn_id character varying(63)
);
COMMENT ON COLUMN mint_request.near_address IS 'max==64. from https://docs.near.org/docs/concepts/account#implicit-accountsMore than 64 characters (including .testnet) from https://wallet.testnet.near.org/create';
COMMENT ON COLUMN mint_request.algorand_address IS 'all algorand ==58 https://developer.algorand.org/docs/get-details/accounts/#keys-and-addresses';
COMMENT ON COLUMN mint_request.near_received_amount IS 'of unit 10^-10 goNEAR.';
COMMENT ON COLUMN mint_request.create_time IS 'int, in milisecond';
COMMENT ON COLUMN mint_request.request_status IS 'should use txn_status ENUM';
COMMENT ON COLUMN mint_request.near_txn_id IS 'checked always 44, but not sure. (seems  32 bytes in base58) using 63.';
COMMENT ON COLUMN mint_request.algo_txn_id IS 'checked always 52, but not sure. using 63. 32 bytes https://developer.algorand.org/docs/get-details/dapps/avm/teal/specification/#loading-values not in base 58, full caps. so its longer.';

-- Indices -------------------------------------------------------

-- CREATE UNIQUE INDEX mint_request_pkey ON mint_request(id int4_ops);
`;

it.skip('create new mint table', async () => {
  ENV; // import process.env
  await postgres.connect();
  await postgres.query(CREATE_NEW_MINT_TABLE_QUERY);
  await postgres.end();
});
