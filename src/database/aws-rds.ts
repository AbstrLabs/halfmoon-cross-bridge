// this file is tested in database.spec.ts

import { Client } from 'pg';

export { passConfFromModule, passConfFromEnv, passEnvAsync, passEnv };
export { pgAwsRdsConnectionTest, postgres, pgConfig };

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

async function passEnvAsync() {
  return process.env.PGHOST;
}

function passEnv() {
  return process.env.PGHOST;
}

const pgConfig = {
  host: process.env.PGHOST!,
  user: process.env.PGUSER!,
  database: process.env.PGDATABASE!,
  password: process.env.PGPASSWORD!,
  port: process.env.PGPORT as any as number,
};
type PgConfig = typeof pgConfig;

function passConfFromModule() {
  return pgConfig;
}
function passConfFromEnv() {
  return {
    host: process.env.PGHOST!,
    user: process.env.PGUSER!,
    database: process.env.PGDATABASE!,
    password: process.env.PGPASSWORD!,
    port: process.env.PGPORT as any as number,
  };
}
function getEnvConfig() {
  // why won't work?
  // helper function for testing
  return;
}

class Postgres {
  // private readonly pgConfig = getEnvConfig();
  private client: Client;

  constructor(pgConfig?: PgConfig) {
    console.log('this.pgConfig : ', pgConfig); // DEV_LOG_TO_REMOVE
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
