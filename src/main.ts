import { loadDotEnv } from './utils/dotenv';

import { db } from './database/db';
import { logger } from './utils/logger';
import { startApiServer } from './api/start-api-server';
import { startBridgeTxnWorker } from './bridge/bridge-worker';

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
  logger.info(`log level: ${logger.level}`);
  // logger.info(`process.env.TS_NODE_DEV: ${process.env.TS_NODE_DEV}`);
  // TODO [LOG]: show some settings like network (testnet/mainnet), accounts, database, etc.
}
async function setupRemoteEnv() {
  // TODO: check statuses of all blockchains
  await db.connect();
}

main().catch((err) => {
  logger.error(err);
});
