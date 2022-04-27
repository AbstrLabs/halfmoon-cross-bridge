export { loadDotEnv };

function loadDotEnv() {
  require('dotenv').config();

  process.env.PORT = process.env.PORT || '3000';
}
