/* Wrapping up AWS-RDS service */
export { postgres };

import { BridgeError, ERRORS } from '../utils/errors';
import { Pool, PoolClient } from 'pg';

import { ENV } from '../utils/dotenv';
import { logger } from '../utils/logger';

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
      logger.verbose('db is already connected');
      return;
    }
    this.client = await this.pool.connect();
    if (!this.client) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_CONNECTION_FAILED);
    }
    this.isConnected = true;
    logger.info('database connected');
  }

  async query(query: string, params: unknown[] = []) {
    if (!this.isConnected || !this.client) {
      throw new BridgeError(ERRORS.INTERNAL.DB_NOT_CONNECTED);
      // await this.connect();
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
      host: ENV.PGHOST,
      user: ENV.PGUSER,
      database: ENV.PGDATABASE,
      password: ENV.PGPASSWORD,
      port: ENV.PGPORT as unknown as number,
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
