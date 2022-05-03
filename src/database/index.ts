export { db };

import { BridgeError, ERRORS } from '../utils/errors';

import { BridgeTxnInfo } from '..';
import { logger } from '../utils/logger';
import { postgres } from './aws-rds';

type DbId = number;
class Database {
  private instance = postgres;
  private mintTableName = `user_mint_request`;
  private burnTableName = `user_burn_request`;

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

  async createTxn(bridgeTxn: BridgeTxnInfo): Promise<number> {
    // will assign a dbId when created.
    // TODO: Err handling, like sending alert email when db cannot connect.
    const query = `
      INSERT INTO ${this.mintTableName} (
        near_address, algorand_address, amount, create_time, request_status, near_tx_hash, algo_txn_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id;
    `;
    const params = [
      bridgeTxn.fromAddr,
      bridgeTxn.toAddr,
      bridgeTxn.atomAmount,
      bridgeTxn.timestamp,
      bridgeTxn.txnStatus,
      bridgeTxn.fromTxnId,
      bridgeTxn.toTxnId,
    ];
    const result = await this.query(query, params);
    const dbId = result[0].id;
    logger.info(`Created bridge txn with id ${dbId}`);
    bridgeTxn.dbId = dbId;
    return dbId as number;
  }
  async readTxn(txnId: DbId) {
    if (typeof txnId !== 'number') {
      txnId = +txnId;
    }
    const query = `
      SELECT * FROM ${this.mintTableName} WHERE id = $1;
    `;
    const params = [txnId];
    const result = await this.query(query, params);
    try {
      this._verifyResultLength(result, txnId);
    } catch (err) {
      throw err;
    }
    return result[0];
  }
  async updateTxn(bridgeTxnInfo: BridgeTxnInfo) {
    // this action will update "request_status"(txnStatus) and "algo_txn_id"(toTxnId)
    // they are the only two fields that are allowed to change after created.
    // will raise err if data mismatch
    // TODO: should confirm current status as well. Status can be "stage"
    const query = `
      UPDATE ${this.mintTableName} SET
        request_status = $1, algo_txn_id = $2
          WHERE (id = $3 AND near_tx_hash = $4 AND algorand_address = $5 AND near_address = $6 AND amount = $7 AND create_time = $8)
      RETURNING id;
    `;
    const params = [
      bridgeTxnInfo.txnStatus,
      bridgeTxnInfo.toTxnId,
      bridgeTxnInfo.dbId,
      bridgeTxnInfo.fromTxnId,
      bridgeTxnInfo.toAddr,
      bridgeTxnInfo.fromAddr,
      bridgeTxnInfo.atomAmount,
      bridgeTxnInfo.timestamp,
    ];
    const result = await this.query(query, params);
    try {
      this._verifyResultLength(result, bridgeTxnInfo);
    } catch (err) {
      throw err;
    }
    logger.verbose(`Updated bridge txn with id ${bridgeTxnInfo.dbId}`);
    return result[0].id;
  }
  async deleteTxn(dbId: DbId) {
    // const query = `
    //   DELETE FROM ${this.mintTableName} WHERE id = $1;
    // `;
    // const params = [dbId];
    // const result = await this.query(query, params);
    throw new BridgeError(ERRORS.INTERNAL.DB_UNAUTHORIZED_ACTION, {
      action: 'deleteTxn',
    });
  }

  private _verifyResultLength(result: any[], TxnInfo: DbId | BridgeTxnInfo) {
    if (result.length === 0) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_TX_NOT_FOUND, {
        TxnInfo: TxnInfo,
      });
    }
    if (result.length > 1) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_TX_NOT_UNIQUE, {
        TxnInfo: TxnInfo,
      });
    }
    return true;
  }
}

const db = new Database();
