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
};

const secret_ENV = {
  NEAR_MASTER_ADDR: 'undefined',
  NEAR_MASTER_PRIV: 'undefined',
  NEAR_MASTER_PASS: 'undefined',
  ALGO_MASTER_ADDR: 'undefined',
  ALGO_MASTER_PRIV: 'undefined',
  ALGO_MASTER_PASS: 'undefined',
  NEAR_EXAMPL_ADDR: 'undefined',
  NEAR_EXAMPL_PRIV: 'undefined',
  NEAR_EXAMPL_PASS: 'undefined',
  ALGO_EXAMPL_ADDR: 'undefined',
  ALGO_EXAMPL_PRIV: 'undefined',
  ALGO_EXAMPL_PASS: 'undefined',
};

const ENV = { ...secret_ENV, ...default_ENV, ...process.env };
