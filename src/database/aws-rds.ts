import { Client, Pool, PoolClient } from 'pg';

// this file is tested in database.spec.ts
// TODO: Make singleton
import { log } from 'console';

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
      throw new Error('Could not connect to database');
    }
    this.isConnected = true;
    log('database connected');
  }

  async query(query: string, params: any[] = []) {
    if (!this.client) {
      log('Not connected to database, connecting now...');
      await this.connect();
    }
    if (!this.client) {
      throw new Error('Could not connect to database');
    }
    const res = await this.client.query(query, params);
    return res.rows;
  }

  disconnect() {
    if (this.isConnected) {
      if (!this.client) {
        throw new Error('client and isConnected do not match');
      }
      this.client.release();
      this.isConnected = false;
    }
  }

  async end() {
    if (this.isConnected) {
      await this.disconnect();
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
    await this.disconnect();
    return res[0].message;
  }
}

// not `new Postgres()` because jest won't initialize with process.env
const postgres = new Postgres(Postgres._configFromEnv());
