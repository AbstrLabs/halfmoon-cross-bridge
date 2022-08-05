import { ENV, loadDotEnv } from './utils/env';

import { db } from './database/db';
import { startApiServer } from './api/app';
import { startBridgeTxnWorker } from './bridge/bridge-worker';
import { log } from './utils/log/log-template';
import { logger } from './utils/log/logger';

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
  log.MAIN.loggerLevel(logger.level);
  log.MAIN.nodeEnv(ENV.NODE_ENV);
  // TODO [LOG]: show some settings like network (testnet/mainnet), accounts, database, etc.
}
async function setupRemoteEnv() {
  // TODO: check statuses of all blockchains
  await db.connect();
}

main().catch((err) => {
  log.MAIN.generalError(err);
});
