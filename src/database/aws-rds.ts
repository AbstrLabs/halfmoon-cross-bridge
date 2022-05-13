/**
 * Wrapping up AWS-RDS service of postgreSQL into one singleton instance `postgres`
 *
 * @exports postgres
 * @typedef {Postgres} : Class {@link Postgres}
 */

export { postgres, type Postgres };

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

/**
 * Wrap up AWS-RDS service of postgreSQL into one singleton instance `postgres`.
 * @classdesc A class for AWS-RDS,  singleton instance of postgres.
 *
 * @param  {PgConfig} pgConfig
 */
class Postgres {
  // private readonly pgConfig = getEnvConfig();
  private client?: PoolClient;
  private pool: Pool;
  isConnected = false;

  constructor(pgConfig?: PgConfig) {
    this.pool = new Pool(pgConfig);
  }

  /**
   * Connect to the database.
   *
   * @async
   * @returns {Promise<void>}
   */
  async connect(): Promise<void> {
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

  /**
   * Generic query method.
   *
   * @async
   * @param  {string} query - SQL query string
   * @param  {unknown[]} params - parameters for the query
   * @returns  {Promise<any[]>} result of the query.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async query(query: string, params: unknown[] = []): Promise<any[]> {
    if (!this.isConnected || !this.client) {
      throw new BridgeError(ERRORS.INTERNAL.DB_NOT_CONNECTED);
      // await this.connect();
    }

    const res = await this.client.query(query, params);
    return res.rows;
  }

  /**
   * Disconnect thread from the database POOL.
   *
   * @returns {void} void
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
   * @async
   * @returns {Promise<void>}
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
   * @async
   * @returns Promise
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async _connectionTest(): Promise<any> {
    await this.connect();
    const res = await this.query('SELECT $1::text as message', [
      'Hello world!',
    ]);
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
