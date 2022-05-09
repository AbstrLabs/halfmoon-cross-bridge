import { loadDotEnv } from './utils/dotenv';
import { startServer } from './server';

loadDotEnv();

process.env.NODE_ENV = process.env.NODE_ENV ?? process.env.TS_NODE_DEV;
process.env.TS_NODE_DEV = process.env.TS_NODE_DEV ?? process.env.TS_NODE_DEV;

// connect db.
startServer();
