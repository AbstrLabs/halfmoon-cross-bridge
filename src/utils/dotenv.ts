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
const ENV = { ...default_ENV, ...process.env };
