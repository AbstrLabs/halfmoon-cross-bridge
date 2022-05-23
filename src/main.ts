import { db } from './database/db';
import { logger } from './utils/logger';
import { startServer } from './server/start-server';

async function main() {
  await db.connect();
  startServer();
}

main().catch((err) => {
  logger.error(err);
});
