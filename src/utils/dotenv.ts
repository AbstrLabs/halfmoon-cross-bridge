/**
 * load and parse .env file
 *
 * @todo 1. separate ENV file to a new variable instead of exporting all.
 * 1. (to hide info like `npm_package_name: 'algorand-near-bridge',1`)
 * 1. I dont know where this was shown, maybe in console.log(ENV)?
 */

export { ENV };

import { BridgeError, ERRORS } from './errors';

import { config } from 'dotenv';
import dpv from 'dotenv-parse-variables';
import { literals } from './literals';

/**
 * Load and Parse .env file.
 *
 * @throws {BridgeError} - {@link ERRORS.INTERNAL.CANNOT_DOTENV_LOAD} if cannot load .env file
 * @returns {dpv.ParsedVariables} parsed .env variables
 */
function parseDotEnv(): dpv.ParsedVariables {
  const env = config();
  if (env.parsed === undefined) {
    throw new BridgeError(ERRORS.INTERNAL.CANNOT_DOTENV_LOAD);
  }

  // ts-node compatibility
  // TODO: not sure if this is working!
  process.env.NODE_ENV = process.env.NODE_ENV ?? process.env.TS_NODE_DEV;
  process.env.TS_NODE_DEV = process.env.TS_NODE_DEV ?? process.env.TS_NODE_DEV;

  return dpv(env.parsed, {
    assignToProcessEnv: true,
    overrideProcessEnv: true,
    ignoreFunctions: true,
  });
}

const default_ENV = {
  PORT: 4190,
  NEAR_CONFIRM_TIMEOUT_SEC: 60,
  NEAR_CONFIRM_INTERVAL_SEC: 5,
  ALGO_CONFIRM_TIMEOUT_SEC: 60,
  ALGO_CONFIRM_INTERVAL_SEC: 5,
  TEST_NET_GO_NEAR_ASSET_ID: 83251085,
  LOGGER_LEVEL: 'silly',
  GO_NEAR_DECIMALS: 10,
  NEAR_TOTAL: 1_000_000_000,
  DB_ORIGIN: 'NEDB',
  ALGO_CONFIRM_ROUND: 60,
  ALGO_NETWORK: 'testnet',
  NEAR_NETWORK: 'testnet',
  MINT_FIX_FEE: 1,
  MINT_MARGIN_FEE_BIPS: 0,
  BURN_FIX_FEE: 1,
  BURN_MARGIN_FEE_BIPS: 20,
  // db config
  PGHOST: literals.NOT_LOADED_FROM_ENV_STR,
  PGUSER: literals.NOT_LOADED_FROM_ENV_STR,
  PGDATABASE: literals.NOT_LOADED_FROM_ENV_STR,
  PGPASSWORD: literals.NOT_LOADED_FROM_ENV_STR,
  PGPORT: literals.NOT_LOADED_FROM_ENV_NUM,
};

const secret_ENV = {
  NEAR_MASTER_ADDR: literals.NOT_LOADED_FROM_ENV_STR,
  NEAR_MASTER_PRIV: literals.NOT_LOADED_FROM_ENV_STR,
  NEAR_MASTER_PASS: literals.NOT_LOADED_FROM_ENV_STR,
  ALGO_MASTER_ADDR: literals.NOT_LOADED_FROM_ENV_STR,
  ALGO_MASTER_PRIV: literals.NOT_LOADED_FROM_ENV_STR,
  ALGO_MASTER_PASS: literals.NOT_LOADED_FROM_ENV_STR,
  NEAR_EXAMPL_ADDR: literals.NOT_LOADED_FROM_ENV_STR,
  NEAR_EXAMPL_PRIV: literals.NOT_LOADED_FROM_ENV_STR,
  NEAR_EXAMPL_PASS: literals.NOT_LOADED_FROM_ENV_STR,
  ALGO_EXAMPL_ADDR: literals.NOT_LOADED_FROM_ENV_STR,
  ALGO_EXAMPL_PRIV: literals.NOT_LOADED_FROM_ENV_STR,
  ALGO_EXAMPL_PASS: literals.NOT_LOADED_FROM_ENV_STR,
  PURE_STAKE_API_KEY: literals.NOT_LOADED_FROM_ENV_STR,
};
const parsed_ENV = parseDotEnv();

const ENV = { ...secret_ENV, ...default_ENV, ...process.env, ...parsed_ENV };

// validate in dotenv that ENV.ALGO_NETWORK is same as ENV.NEAR_NETWORK
if (ENV.ALGO_NETWORK !== ENV.NEAR_NETWORK) {
  throw new BridgeError(ERRORS.INTERNAL.NETWORK_MISMATCH);
}
