export { loadDotEnv, ENV };

function loadDotEnv() {
  require('dotenv').config();
  // TODO:(DONE) update default value of env settings
}

const default_ENV = {
  PORT: '4190',
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
loadDotEnv();
const ENV = { ...secret_ENV, ...default_ENV, ...process.env };
