import { ENV } from '../dotenv';
import { db } from '../../database/db';

ENV;
const SECOND = 1000;
jest.setTimeout(10 * SECOND); // in milliseconds

beforeAll(async () => {
  await db.connect();
});
afterAll(async () => {
  await db.end();
});
