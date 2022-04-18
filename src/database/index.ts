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
    // will assign a dbId when created.
    // TODO: Err handling, like sending alert email when db cannot connect.
    const query = `
      INSERT INTO user_mint_request (
        near_address, algorand_address, amount, create_time, request_status, near_tx_hash, algo_txn_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
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
    const dbId = result[0].id;
    log(`Created bridge tx with id ${dbId}`);
    bridgeTx.dbId = dbId;
    return dbId;
  }

  async updateTx(bridgeTx: BridgeTxInfo) {
    // this action will update "request_status"(txStatus) and "algo_txn_id"(toTxId)
    // they are the only two fields that are allowed to change after created.
    // will raise err if data mismatch
    // TODO: should confirm current status as well. Status can be "stage"
    const query = `
      UPDATE user_mint_request SET
        request_status = $1, algo_txn_id = $2
          WHERE (id = $3 AND near_tx_hash = $4 AND algorand_address = $5 AND near_address = $6 AND amount = $7 AND create_time = $8)
      RETURNING id;
    `;
    const params = [
      bridgeTx.txStatus,
      bridgeTx.toTxId,
      bridgeTx.dbId,
      bridgeTx.fromTxId,
      bridgeTx.toAddr,
      bridgeTx.fromAddr,
      bridgeTx.amount,
      bridgeTx.timestamp,
    ];
    const result = await this.query(query, params);
    if (result.length === 0) {
      throw new Error(`No TX found to update.`);
    }
    if (result.length > 1) {
      throw new Error(`Found too many TX to update.`);
    }
    log(`Updated bridge tx with id ${bridgeTx.dbId}`);
    return result[0].id;
  }
}

const db = new Database();
