export { db };

import { BridgeError, ERRORS } from '../utils/errors';

import { BridgeTxInfo } from '..';
import { logger } from '../utils/logger';
import { postgres } from './aws-rds';

type DbId = number;
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

  async createTx(bridgeTx: BridgeTxInfo): Promise<number> {
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
    logger.info(`Created bridge tx with id ${dbId}`);
    bridgeTx.dbId = dbId;
    return dbId as number;
  }
  async readTx(txId: DbId) {
    if (typeof txId !== 'number') {
      txId = +txId;
    }
    const query = `
      SELECT * FROM user_mint_request WHERE id = $1;
    `;
    const params = [txId];
    const result = await this.query(query, params);
    try {
      this._verifyResultLength(result, txId);
    } catch (err) {
      throw err;
    }
    return result[0];
  }
  async updateTx(bridgeTxInfo: BridgeTxInfo) {
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
      bridgeTxInfo.txStatus,
      bridgeTxInfo.toTxId,
      bridgeTxInfo.dbId,
      bridgeTxInfo.fromTxId,
      bridgeTxInfo.toAddr,
      bridgeTxInfo.fromAddr,
      bridgeTxInfo.amount,
      bridgeTxInfo.timestamp,
    ];
    const result = await this.query(query, params);
    try {
      this._verifyResultLength(result, bridgeTxInfo);
    } catch (err) {
      throw err;
    }
    logger.verbose(`Updated bridge tx with id ${bridgeTxInfo.dbId}`);
    return result[0].id;
  }
  async deleteTx(txId: DbId) {
    // const query = `
    //   DELETE FROM user_mint_request WHERE id = $1;
    // `;
    // const params = [txId];
    // const result = await this.query(query, params);
    throw new BridgeError(ERRORS.INTERNAL.DB_UNAUTHORIZED_ACTION, {
      action: 'deleteTx',
    });
  }

  private _verifyResultLength(result: any[], TxInfo: DbId | BridgeTxInfo) {
    if (result.length === 0) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_TX_NOT_FOUND, { TxInfo });
    }
    if (result.length > 1) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_TX_NOT_UNIQUE, { TxInfo });
    }
    return true;
  }
}

const db = new Database();
