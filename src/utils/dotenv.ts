export { loadDotEnv };

function loadDotEnv() {
  require('dotenv').config();

  process.env.PORT = process.env.PORT || '3000';
  // TODO: finish default value of env settings
  // process.env.NEAR_TIMEOUT_SEC = process.env.NEAR_TIMEOUT_SEC || '60';
}
