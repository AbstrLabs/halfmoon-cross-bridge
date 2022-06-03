import { db } from '../../database/db';
import { loadDotEnv } from '../dotenv';
import { logger } from '../logger';

loadDotEnv(); // better than calling `ENV`.
const SECOND = 1000;
jest.setTimeout(10 * SECOND); // in milliseconds

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
