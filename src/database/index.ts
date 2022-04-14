export { db };

import { ENV } from '../utils/dotenv';
import Nedb from 'nedb';
import { log } from '../utils/logger';
import { nedb } from './nedb';

var db: Nedb;
if (ENV.DB_ORIGIN === 'NEDB') {
  db = nedb;
  log('nedb running');
} else if (ENV.DB_ORIGIN === 'AWS_RDS') {
  // throw new Error('RDS not implemented yet');
  db = nedb;
  log('RDS running');
} else {
  log(`error: wrong DB_ORIGIN: ${ENV.DB_ORIGIN}`);
}
