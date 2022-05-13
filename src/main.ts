import { db } from './database/db';
import { startServer } from './server';

db.connect();
startServer();
