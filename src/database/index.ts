export { db };

import { postgres } from './aws-rds';

class Database {
  private instance = postgres;

  get isConnected() {
    return this.instance.isConnected;
  }

  constructor() {}

  async connect() {
    await this.instance.connect();
  }

  async query(query: string, params: any[] = []) {
    return await this.instance.query(query, params);
  }

  async disconnect() {
    this.instance.disconnect();
  }

  async end() {
    await this.instance.end();
  }
}

const db = new Database();
