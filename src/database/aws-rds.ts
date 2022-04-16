// this file is tested in database.spec.ts

import { Client } from 'pg';

export { Postgres }; // for test
export { pgAwsRdsConnectionTest, postgres };

async function pgAwsRdsConnectionTest() {
  // console.log('process.env.PGHOST : ', process.env.PGHOST); // DEV_LOG_TO_REMOVE

  const client = new Client();
  await client.connect();
  const res = await client.query('SELECT $1::text as message', [
    'Hello world!',
  ]);
  await client.end();
  return res.rows[0].message;
}

type PgConfig = {
  host: string;
  user: string;
  database: string;
  password: string;
  port: number;
};

class Postgres {
  // private readonly pgConfig = getEnvConfig();
  private client: Client;

  constructor(pgConfig?: PgConfig) {
    this.client = new Client(pgConfig);
  }

  async connect() {
    await this.client.connect();
  }

  async query(query: string, params: any[] = []) {
    const res = await this.client.query(query, params);
    return res.rows;
  }

  async disconnect() {
    await this.client.end();
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

const postgres = new Postgres();
