import { ENV, loadDotEnv } from './utils/dotenv';

import { db } from './database/db';
import { logger } from './utils/logger';
import { startServer } from './server/start-server';

async function main() {
  /* SETUP ENV */
  setupLocalEnv();
  showWelcome();
  await setupRemoteEnv();
  startServer();
}

function setupLocalEnv() {
  loadDotEnv();
}
function showWelcome() {
  logger.level = ENV.LOGGER_LEVEL;
  logger.info(`log level: ${ENV.LOGGER_LEVEL}`);
}
async function setupRemoteEnv() {
  // TODO: check statuses of all blockchains
  await db.connect();
}

main().catch((err) => {
  logger.error(err);
});
