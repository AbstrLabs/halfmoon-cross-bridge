import { loadDotEnv } from './utils/dotenv';
import { startServer } from './server';

loadDotEnv();
// connect db.
startServer();
