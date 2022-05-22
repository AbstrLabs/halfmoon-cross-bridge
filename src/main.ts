import { db } from './database/db';
import { startServer } from './server';

await db.connect();
startServer();
