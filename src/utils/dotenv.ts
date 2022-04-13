// load and parse .env file
// TODO: separate ENV file to a new variable instead of exporting all.
// TODO: (to hide info like `npm_package_name: 'algorand-near-bridge',1`)

export { loadDotEnv, ENV };

import dpv from 'dotenv-parse-variables';

function loadDotEnv() {
  let env = require('dotenv').config();
  require('dotenv-parse-variables');

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
};

const secret_ENV = {
  NEAR_MASTER_ADDR: 'not_loaded_from_env',
  NEAR_MASTER_PRIV: 'not_loaded_from_env',
  NEAR_MASTER_PASS: 'not_loaded_from_env',
  ALGO_MASTER_ADDR: 'not_loaded_from_env',
  ALGO_MASTER_PRIV: 'not_loaded_from_env',
  ALGO_MASTER_PASS: 'not_loaded_from_env',
  NEAR_EXAMPL_ADDR: 'not_loaded_from_env',
  NEAR_EXAMPL_PRIV: 'not_loaded_from_env',
  NEAR_EXAMPL_PASS: 'not_loaded_from_env',
  ALGO_EXAMPL_ADDR: 'not_loaded_from_env',
  ALGO_EXAMPL_PRIV: 'not_loaded_from_env',
  ALGO_EXAMPL_PASS: 'not_loaded_from_env',
  PURE_STAKE_API_KEY: 'not_loaded_from_env',
};
const parsed_ENV = loadDotEnv();

const ENV = { ...secret_ENV, ...default_ENV, ...process.env, ...parsed_ENV };

/* TS engine doesn't know number|string

const numberFields = [
  'PORT',
  'NEAR_CONFIRM_TIMEOUT_SEC',
  'NEAR_CONFIRM_INTERVAL_SEC',
  'ALGO_CONFIRM_TIMEOUT_SEC',
  'ALGO_CONFIRM_INTERVAL_SEC',
  'TEST_NET_GO_NEAR_ASSET_ID',
];
const parseIntField = (
  env: { [k: string]: string | number },
  fields: string[]
) => {
  const ret = { ...env };
  fields.forEach((field) => {
    if (typeof ret[field] === 'string') {
      ret[field] = parseInt(ret[field] as string);
    }
  });
  return ret;
};

let strENV = { ...secret_ENV, ...default_ENV, ...process.env };
const ENV = parseIntField(strENV, numberFields);
*/
