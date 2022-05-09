// TODO: 1. separate database to database.ts from index.ts
// TODO: 2. Wrap this piece below
/* const tableName = this._inferTableName(bridgeTxn);
if (!this.isConnected) {
  await this.connect();
} */
export { db };
import { BridgeError, ERRORS } from '../utils/errors';

import { BridgeTxn } from '../bridge';
import { parseDbItem, type DbId, type DbItem } from '../utils/type';
import { TxnType } from '../blockchain';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';
import { postgres } from './aws-rds';
import { TableName } from '.';

class Database {
  private instance = postgres;
  private mintTableName: TableName = TableName.MINT_TABLE_NAME;
  private burnTableName: TableName = TableName.BURN_TABLE_NAME;

  get isConnected() {
    return this.instance.isConnected;
  }

  // TODO: add with settings constructor() {}

  async connect() {
    await this.instance.connect();
  }

  async query(query: string, params: unknown[] = []) {
    return await this.instance.query(query, params);
  }

  disconnect() {
    this.instance.disconnect();
  }

  async end() {
    await this.instance.end();
  }

  public async createTxn(bridgeTxn: BridgeTxn): Promise<DbId> {
    // will assign a dbId on creation.
    // TODO: Err handling, like sending alert email when db cannot connect.
    const tableName = this._inferTableName(bridgeTxn);
    if (!this.isConnected) {
      await this.connect();
    }

    const query = `
      INSERT INTO ${tableName} 
      (
        txn_status, created_time, fixed_fee_atom, from_addr, from_amount_atom,
        from_txn_id, margin_fee_atom, to_addr, to_amount_atom, to_txn_id
      ) 
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10
      ) 
      RETURNING db_id;
    `;
    const params = [
      bridgeTxn.txnStatus,
      bridgeTxn.createdTime,
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
    this._verifyResultLength(result, bridgeTxn);

    const dbId = result[0]['db_id'];
    // TODO: make `infer` private -> public getter
    bridgeTxn.txnType = bridgeTxn.inferTxnType();
    logger.info(literals.DB_ENTRY_CREATED(bridgeTxn.txnType, dbId));
    bridgeTxn.dbId = dbId;
    return dbId as DbId;
  }

  public async readTxn(txnId: DbId, txnType: TxnType): Promise<DbItem> {
    // currently only used in test. not fixing.
    // should return an BridgeTxn
    // should use BridgeTxn.fromDbItem to convert to BridgeTxn

    // TODO: param of _inferTableName should be TxnType
    let tableName: TableName;
    if (txnType === TxnType.MINT) {
      tableName = this.mintTableName;
    } else if (txnType === TxnType.BURN) {
      tableName = this.burnTableName;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
        txnType: txnType,
      });
    }

    if (!this.isConnected) {
      await this.connect();
    }

    const query = `
      SELECT * FROM ${tableName} WHERE db_id = $1;
    `;
    const params = [txnId];
    const result = await this.query(query, params);
    this._verifyResultLength(result, txnId);

    const dbItem = parseDbItem(result[0]);
    return dbItem;
  }

  async updateTxn(bridgeTxn: BridgeTxn) {
    // this action will update "request_status"(txnStatus) and "algo_txn_id"(toTxnId)
    // they are the only two fields that are allowed to change after created.
    // will raise err if data mismatch
    // TODO: should confirm current status as well. Status can be "stage"
    const tableName = this._inferTableName(bridgeTxn);
    if (!this.isConnected) {
      await this.connect();
    }

    const query = `
      UPDATE ${tableName} SET
        txn_status=$1, to_txn_id = $10
          WHERE (
            db_id=$11 AND created_time=$2 AND fixed_fee_atom=$3 AND
            from_addr=$4 AND from_amount_atom=$5 AND from_txn_id=$6 AND
            margin_fee_atom=$7 AND to_addr=$8 AND to_amount_atom=$9
          )
      RETURNING db_id;
    `;
    const params = [
      bridgeTxn.txnStatus,
      bridgeTxn.createdTime,
      bridgeTxn.fixedFeeAtom,
      bridgeTxn.fromAddr,
      bridgeTxn.fromAmountAtom,
      bridgeTxn.fromTxnId,
      bridgeTxn.marginFeeAtom,
      bridgeTxn.toAddr,
      bridgeTxn.toAmountAtom,
      bridgeTxn.toTxnId,
      bridgeTxn.dbId,
    ];
    const result = await this.query(query, params);

    this._verifyResultLength(result, bridgeTxn);

    logger.verbose(`Updated bridge txn with id ${bridgeTxn.dbId}`);
    return result[0].db_id;
  }
  async deleteTxn(dbId: DbId, txnType: TxnType) {
    // never used.

    // const query = `
    //   DELETE FROM ${this.mintTableName} WHERE id = $1;
    // `;
    // const params = [dbId];
    // const result = await this.query(query, params);
    throw new BridgeError(ERRORS.INTERNAL.DB_UNAUTHORIZED_ACTION, {
      action: 'deleteTxn',
      dbId: dbId,
      txnType: txnType,
    });
  }

  // PRIVATE METHODS

  private _inferTableName(bridgeTxn: BridgeTxn) {
    let tableName: TableName;
    if (bridgeTxn.txnType === TxnType.MINT) {
      tableName = this.mintTableName;
    } else if (bridgeTxn.txnType === TxnType.BURN) {
      tableName = this.burnTableName;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
        txnType: bridgeTxn.txnType,
      });
    }
    return tableName;
  }

  private _verifyResultLength(result: unknown[], TxnInfo: DbId | BridgeTxn) {
    // TODO: TxnInfo -> ErrInfoObj
    if (result.length === 0) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_TXN_NOT_FOUND, {
        TxnInfo: TxnInfo,
      });
    }
    if (result.length > 1) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_TXN_NOT_UNIQUE, {
        TxnInfo: TxnInfo,
      });
    }
    return true;
  }
}

const db = new Database();
