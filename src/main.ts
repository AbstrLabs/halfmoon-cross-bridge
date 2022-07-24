import { loadDotEnv } from './utils/dotenv';

import { db } from './database/db';
import { logger } from './utils/log/logger';
import { startApiServer } from './api/start-api-server';
import { startBridgeTxnWorker } from './bridge/bridge-worker';
import { log } from './utils/log/log-template';

async function main() {
  /* SETUP ENV */
  setupLocalEnv();
  showWelcome();
  await setupRemoteEnv();

  /* START SERVER */
  startBridgeTxnWorker();
  startApiServer();
}

function setupLocalEnv() {
  loadDotEnv();
}
function showWelcome() {
  log.MAIN.loggerLevel();
  // TODO [LOG]: show some settings like network (testnet/mainnet), accounts, database, etc.
}
async function setupRemoteEnv() {
  // TODO: check statuses of all blockchains
  await db.connect();
}

main().catch((err) => {
  logger.error(err);
});
