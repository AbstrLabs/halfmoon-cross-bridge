export { db };

import { GenericTxInfo } from '..';
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

  async createMintTx(txInfo: GenericTxInfo) {
    const query = `INSERT INTO user_mint_request (from_address, to_address, amount, tx_id) VALUES ($1, $2, $3, $4);`;
    const params = [txInfo.from, txInfo.to, txInfo.amount, txInfo.txId];
    return await this.query(query, params);
  }
}

const db = new Database();
