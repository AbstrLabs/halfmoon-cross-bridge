import { db } from './database/db';
import { loadDotEnv } from './utils/dotenv';
import { startServer } from './server';

loadDotEnv();
db.connect();
startServer();
