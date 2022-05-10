// TODO: send an alert email when db cannot connect.

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
  // private __debugRandomId: string;

  // constructor() {
  // const trace = new Error().stack;
  // this.__debugRandomId = Math.random().toString(36).substring(2, 15);
  // console.log(
  //   `DB with __debugRandomId: ${this.__debugRandomId} is created at ${trace}`
  // );
  // }

  get isConnected() {
    return this.instance.isConnected;
  }

  // TODO: add with settings constructor() {}

  async connect() {
    await this.instance.connect();
  }

  async query(query: string, params: unknown[] = []) {
    // console.log('__debugRandomId : ', this.__debugRandomId); // DEV_LOG_TO_REMOVE
    return await this.instance.query(query, params);
  }

  disconnect() {
    this.instance.disconnect();
  }

  async end() {
    await this.instance.end();
  }

  public async createTxn(bridgeTxn: BridgeTxn): Promise<DbId> {
    // TODO: sent alert email when db cannot connect.
    // will assign and return a dbId on creation.

    // next line: if null, will throw error.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tableName = this._inferTableName(bridgeTxn.txnType!);
    if (!this.isConnected) {
      logger.error('db is not connected while it should');
      // await this.connect();
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
    bridgeTxn.txnType = bridgeTxn.getTxnType();
    logger.info(literals.DB_ENTRY_CREATED(bridgeTxn.txnType, dbId));
    bridgeTxn.dbId = dbId;
    return dbId as DbId;
  }

  public async readTxn(txnId: DbId, txnType: TxnType): Promise<DbItem[]> {
    // next line: if null, will throw error.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tableName = this._inferTableName(txnType);

    if (!this.isConnected) {
      await this.connect();
    }

    const query = `
      SELECT * FROM ${tableName} WHERE db_id = $1;
    `;
    const params = [txnId];
    const result = await this.query(query, params);
    return result;
  }

  public async updateTxn(bridgeTxn: BridgeTxn) {
    // this action will update "request_status"(txnStatus) and "algo_txn_id"(toTxnId)
    // they are the only two fields that are allowed to change after created.
    // will raise err if data mismatch
    // TODO: should confirm current status as well. Status can be "stage"

    // next line: if null, will throw error.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tableName = this._inferTableName(bridgeTxn.txnType!);
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
    return result[0].db_id as DbId; // TODO: parse DbId
  }

  public async readUniqueTxn(txnId: DbId, txnType: TxnType): Promise<DbItem> {
    // currently only used in test. not fixing.
    // should return an BridgeTxn
    // should use BridgeTxn.fromDbItem to convert to BridgeTxn

    const result = await this.readTxn(txnId, txnType);
    this._verifyResultLength(result, txnId);
    const dbItem = parseDbItem(result[0]);
    return dbItem;
  }

  private async deleteTxn(dbId: DbId, txnType: TxnType) {
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

  private _inferTableName(txnType: TxnType) {
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

/* failed attempt on singleton for jest

class DbSingleton {
  private static instance: Database;

  public static getInstance() {
    if (DbSingleton.instance === undefined) {
      DbSingleton.instance = new Database();
    }
    return DbSingleton.instance;
  }
}
const db = DbSingleton.getInstance();
 */
