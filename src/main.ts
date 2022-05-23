import { db } from './database/db';
import { logger } from './utils/logger';
import { startServer } from './server/start-server';

db.connect().catch((err) => {
  logger.error(err);
});
startServer();
