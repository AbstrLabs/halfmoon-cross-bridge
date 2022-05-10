// load and parse .env file
// TODO: 1. separate ENV file to a new variable instead of exporting all.
// TODO: 1. (to hide info like `npm_package_name: 'algorand-near-bridge',1`)

export { loadDotEnv, ENV };

import { BridgeError, ERRORS } from './errors';

import { config } from 'dotenv';
import dpv from 'dotenv-parse-variables';
import { literals } from './literals';

function loadDotEnv() {
  const env = config();
  if (env.parsed === undefined) {
    throw new BridgeError(ERRORS.INTERNAL.CANNOT_DOTENV_LOAD);
  }

  // ts-node compatibility
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
  LOGGER_LEVEL: 'info',
  GO_NEAR_DECIMALS: 10,
  NEAR_TOTAL: 1_000_000_000,
  DB_ORIGIN: 'NEDB',
  ALGO_CONFIRM_ROUND: 60,
  ALGO_NETWORK: 'testnet',
  NEAR_NETWORK: 'testnet',
  MINT_FIX_FEE: 1,
  MINT_PERCENT_FEE: 0,
  BURN_FIX_FEE: 1,
  BURN_PERCENT_FEE: 2,
};

const secret_ENV = {
  NEAR_MASTER_ADDR: literals.NOT_LOADED_FROM_ENV,
  NEAR_MASTER_PRIV: literals.NOT_LOADED_FROM_ENV,
  NEAR_MASTER_PASS: literals.NOT_LOADED_FROM_ENV,
  ALGO_MASTER_ADDR: literals.NOT_LOADED_FROM_ENV,
  ALGO_MASTER_PRIV: literals.NOT_LOADED_FROM_ENV,
  ALGO_MASTER_PASS: literals.NOT_LOADED_FROM_ENV,
  NEAR_EXAMPL_ADDR: literals.NOT_LOADED_FROM_ENV,
  NEAR_EXAMPL_PRIV: literals.NOT_LOADED_FROM_ENV,
  NEAR_EXAMPL_PASS: literals.NOT_LOADED_FROM_ENV,
  ALGO_EXAMPL_ADDR: literals.NOT_LOADED_FROM_ENV,
  ALGO_EXAMPL_PRIV: literals.NOT_LOADED_FROM_ENV,
  ALGO_EXAMPL_PASS: literals.NOT_LOADED_FROM_ENV,
  PURE_STAKE_API_KEY: literals.NOT_LOADED_FROM_ENV,
};
const parsed_ENV = loadDotEnv();

const ENV = { ...secret_ENV, ...default_ENV, ...process.env, ...parsed_ENV };
