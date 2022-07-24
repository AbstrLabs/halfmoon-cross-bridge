import { db } from '../../database/db';
import { loadDotEnv } from '../../utils/dotenv';
import { logger } from '../../utils/log/logger';

loadDotEnv({ isTest: true }); // better than calling `ENV`.
logger.level = 'verbose';

const SECOND = 1000;
jest.setTimeout(10 * SECOND); // in milliseconds

// jest.spyOn(logger, 'info').mockImplementation((infoObj: object) => {
//   console.log(infoObj);
//   return logger;
// });
// jest.spyOn(logger, 'error').mockImplementation((infoObj: object) => {
//   console.error(infoObj);
//   return logger;
// });

beforeAll(async () => {
  try {
    await db.connect();
  } catch {
    logger.error('Error connecting to database');
    return;
  }
});
afterAll(async () => {
  await db.end();
});
