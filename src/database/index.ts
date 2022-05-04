export { db };

import { BridgeError, ERRORS } from '../utils/errors';

import { BridgeTxnInfo } from '../blockchain/bridge';
import { TxnType } from '../blockchain';
import { literal } from '../utils/literal';
import { logger } from '../utils/logger';
import { postgres } from './aws-rds';

type DbId = number;

enum tableName {
  MINT_TABLE_NAME = `mint_request`,
  BURN_TABLE_NAME = `burn_request`,
}

class Database {
  private instance = postgres;
  private mintTableName: tableName = tableName.MINT_TABLE_NAME;
  private burnTableName: tableName = tableName.BURN_TABLE_NAME;

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

  private async _createTxn(bridgeTxn: BridgeTxnInfo): Promise<DbId> {
    // will assign a dbId on creation.
    // TODO: Err handling, like sending alert email when db cannot connect.
    let tableName;

    if (bridgeTxn.txnType === TxnType.MINT) {
      tableName = this.mintTableName;
    } else if (bridgeTxn.txnType === TxnType.BURN) {
      tableName = this.burnTableName;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
        txnType: bridgeTxn.txnType,
      });
    }

    if (!this.isConnected) {
      await this.connect();
    }

    const query = `
      INSERT INTO ${tableName} 
      (
        txn_status, create_time, fixed_fee_atom, from_addr, from_amount_atom,
        from_txn_id, margin_fee_atom, to_addr, to_amount_atom, to_txn_id
      ) 
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10
      ) 
      RETURNING id;
    `;
    const params = [
      bridgeTxn.txnStatus,
      bridgeTxn.timestamp,
      bridgeTxn.fixedFeeAtom,
      bridgeTxn.fromAddr,
      bridgeTxn.fromAmountAtom,
      bridgeTxn.fromTxnId,
      bridgeTxn.marginFeeAtom,
      bridgeTxn.toAddr,
      bridgeTxn.toAmountAtom,
      bridgeTxn.toTxnId,
    ];
    const result = await this.query(query, params);
    const dbId = result[0].id;
    logger.info(literal.DB_ENTRY_CREATED(bridgeTxn.txnType, dbId));
    bridgeTxn.dbId = dbId;
    return dbId as DbId;
  }

  async createMintTxn(bridgeTxn: BridgeTxnInfo): Promise<DbId> {
    // will assign a dbId on creation.
    return await this._createTxn(bridgeTxn);
  }
  async readMintTxn(txnId: DbId) {
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
  async updateMintTxn(bridgeTxnInfo: BridgeTxnInfo) {
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
      bridgeTxnInfo.fromAmountAtom,
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
  async deleteMintTxn(dbId: DbId) {
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
