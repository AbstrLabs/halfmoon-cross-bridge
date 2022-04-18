export { db };

import { BridgeTxInfo, GenericTxInfo } from '..';

import { log } from '../utils/logger';
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

  disconnect() {
    this.instance.disconnect();
  }

  async end() {
    await this.instance.end();
  }

  async createTx(bridgeTx: BridgeTxInfo) {
    const query = `
      INSERT INTO user_mint_request (
        near_address, algorand_address, amount, create_time, request_status, near_tx_hash, algo_txn_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    const params = [
      bridgeTx.fromAddr,
      bridgeTx.toAddr,
      bridgeTx.amount,
      bridgeTx.timestamp,
      bridgeTx.txStatus,
      bridgeTx.fromTxId,
      bridgeTx.toTxId,
    ];
    const result = await this.query(query, params);
    log(`Created bridge tx with id ${result[0].id}`);
    return result[0].id;
  }
}

const db = new Database();
