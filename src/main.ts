import { ENV, loadDotEnv } from './utils/dotenv';

import { db } from './database/db';
import { logger } from './utils/logger';
import { startServer } from './server/start-server';

async function main() {
  loadDotEnv();
  logger.level = ENV.LOGGER_LEVEL;
  logger.info(`log level: ${ENV.LOGGER_LEVEL}`);
  await db.connect();
  startServer();
}

main().catch((err) => {
  logger.error(err);
});
