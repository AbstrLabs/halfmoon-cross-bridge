import { BridgeError, ERRORS } from '../utils/errors';
import { Client, Pool, PoolClient } from 'pg';

import { logger } from '../utils/logger';

// this file is tested in database.spec.ts
// TODO: Make singleton

export { postgres };

type PgConfig = {
  host: string;
  user: string;
  database: string;
  password: string;
  port: number;
};

class Postgres {
  // private readonly pgConfig = getEnvConfig();
  private client?: PoolClient;
  private pool: Pool;
  isConnected = false;

  constructor(pgConfig?: PgConfig) {
    this.pool = new Pool(pgConfig);
  }

  async connect() {
    if (this.isConnected) {
      return;
    }
    this.client = await this.pool.connect();
    if (!this.client) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_CONNECTION_FAILED);
    }
    this.isConnected = true;
    logger.info('database connected');
  }

  async query(query: string, params: any[] = []) {
    if (!this.client) {
      logger.info('Not connected to database, connecting now...');
      await this.connect();
    }
    if (!this.client) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_CONNECTION_FAILED);
    }
    const res = await this.client.query(query, params);
    return res.rows;
  }

  disconnect() {
    if (this.isConnected) {
      if (!this.client) {
        throw new BridgeError(ERRORS.INTERNAL.DB_CLASS_LOGIC_ERROR);
      }
      this.client.release();
      this.isConnected = false;
    }
  }

  async end() {
    if (this.isConnected) {
      this.disconnect();
    }
    await this.pool.end();
  }

  static _configFromEnv(): PgConfig {
    return {
      host: process.env.PGHOST!,
      user: process.env.PGUSER!,
      database: process.env.PGDATABASE!,
      password: process.env.PGPASSWORD!,
      port: process.env.PGPORT as any as number,
    };
  }

  async _connectionTest() {
    await this.connect();
    const res = await this.query('SELECT $1::text as message', [
      'Hello world!',
    ]);
    this.disconnect();
    return res[0].message;
  }
}

// not `new Postgres()` because jest won't initialize with process.env
const postgres = new Postgres(Postgres._configFromEnv());
