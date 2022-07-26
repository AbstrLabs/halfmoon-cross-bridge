/**
 * Wrapping up AWS-RDS service of postgreSQL into one singleton instance `postgres`
 */

export { postgres, type Postgres };

import { BridgeError, ERRORS } from '../utils/bridge-error';
import { Pool, PoolClient } from 'pg';

import { ENV } from '../utils/dotenv';
import { log } from '../utils/log/log-template';

interface PgConfig {
  host: string;
  user: string;
  database: string;
  password: string;
  port: number;
}

/**
 * Wrap up AWS-RDS service of postgreSQL into one singleton instance `postgres`.
 *
 * @param pgConfig - PostgreSQL configuration
 */
class Postgres {
  private client?: PoolClient;
  private pool: Pool;
  isConnected = false;

  constructor(pgConfig: PgConfig) {
    this.pool = new Pool(pgConfig);
  }

  /**
   * Connect to the database.
   *
   * @returns Promise of void
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      log.ARDS.onDoubleConnect();
      return;
    }
    try {
      this.client = await this.pool.connect();
    } catch (err) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_CONNECTION_FAILED, {
        dbServerError: err,
      });
    }
    this.isConnected = true;
    log.ARDS.onConnect();
  }

  /**
   * Generic query method.
   *
   * @param query - SQL query string
   * @param params - List of parameters for the query
   * @returns Promise of the query result
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async query(query: string, params: any[] = []): Promise<any[]> {
    if (!this.isConnected || !this.client) {
      throw new BridgeError(ERRORS.INTERNAL.DB_NOT_CONNECTED);
      // await this.connect();
    }

    const res = await this.client.query(query, params);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return res.rows;
  }

  /**
   * Disconnect thread from the database POOL.
   *
   */
  disconnect(): void {
    if (this.isConnected) {
      if (!this.client) {
        throw new BridgeError(ERRORS.INTERNAL.DB_CLASS_LOGIC_ERROR);
      }
      this.client.release();
      this.isConnected = false;
    }
  }

  /**
   * End the database pool connection.
   *
   * @returns Promise of void
   */
  async end(): Promise<void> {
    if (this.isConnected) {
      this.disconnect();
    }
    await this.pool.end();
  }

  /**
   * Create a new database table.
   * Only for testing purpose.
   *
   * @returns Promise
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async _connectionTest(): Promise<any> {
    await this.connect();
    const res = (await this.query('SELECT $1::text as message', [
      'Hello world!',
    ])) as { message: string }[];
    this.disconnect();
    return res[0].message;
  }
}

// not `new Postgres()` because jest won't initialize with process.env
const pgConfig: PgConfig = {
  host: ENV.PGHOST,
  user: ENV.PGUSER,
  database: ENV.PGDATABASE,
  password: ENV.PGPASSWORD,
  port: ENV.PGPORT,
};
const postgres = new Postgres(pgConfig);
