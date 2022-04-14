import Nedb from 'nedb';
import { log } from '../utils/logger';
export { db };

const db = new Nedb({ filename: './nedb.json', autoload: true });
db.loadDatabase();
log('nedb running');
