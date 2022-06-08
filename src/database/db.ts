/**
 * Export a singleton instance `db` to handle all database requests
 *
 * @exports db
 */

export { db, type Database };
import { BridgeError, ERRORS } from '../utils/errors';

import { type BridgeTxn } from '../bridge';
import { type DbId, type DbItem, parseDbItem, parseDbId } from '../utils/type';
import { TxnType } from '../blockchain';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';
import { type Postgres, postgres } from './aws-rds';
import { TableName } from '.';

/**
 * A database class to handle all database requests. Should be used as a singleton.
 *
 * @param  {Postgres} instance - an instance of {@link Postgres}
 * @param  {{mintTableName:TableName;burnTableName:TableName}} tableNames - table names in the database
 */
class Database {
  private instance;
  private mintTableName;
  private burnTableName;

  constructor(
    instance: Postgres,
    tableNames: { mintTableName: TableName; burnTableName: TableName }
  ) {
    this.instance = instance;
    this.mintTableName = tableNames.mintTableName;
    this.burnTableName = tableNames.burnTableName;
  }

  /**
   * Wrapped getter of isConnected.
   *
   * @returns {boolean} true if connected, false otherwise
   */
  get isConnected(): boolean {
    return this.instance.isConnected;
  }

  /**
   * Connects to the database.
   *
   * @async
   * @returns {Promise<void>} promise of `void`
   */
  async connect(): Promise<void> {
    await this.instance.connect();
  }

  /**
   * Generic database query method.
   *
   * @async
   * @param {string} query a sql query string
   * @param {any[]} params
   * @returns {Promise<any[]>} query result
   */
  async query(
    query: string,
    params: (unknown | undefined)[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await this.instance.query(query, params);
    } catch (err: unknown) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_QUERY_FAILED, {
        connected: this.isConnected,
        err,
        query,
        params,
      });
    }
  }

  /**
   * Disconnects pool thread from the database.
   *
   * @returns {void} no return value
   */
  disconnect(): void {
    this.instance.disconnect();
  }

  /**
   * Stop the database pool.
   *
   * @async
   * @returns {Promise<void>} promise of `void`
   */
  async end(): Promise<void> {
    await this.instance.end();
  }

  /**
   * Create a new {@link BridgeTxn} in the database.
   *
   * @async
   * @param   {BridgeTxn} bridgeTxn - a {@link BridgeTxn} to be inserted into the database
   * @returns {Promise<DbId>}  promise of the created dbId
   */
  public async createTxn(bridgeTxn: BridgeTxn): Promise<DbId> {
    // will assign and return a dbId on creation.

    const tableName = this._inferTableName(bridgeTxn.txnType);
    if (!this.isConnected) {
      logger.error('db is not connected while it should');
      await this.connect();
    }
    // const bridgeTxnObj = bridgeTxn.toObject();
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
    const params: (string | bigint | undefined | null)[] = [
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
    const queryResult = await this.query(query, params);
    const result = this._verifyResultUniqueness(queryResult, {
      bridgeTxn: bridgeTxn,
      at: 'db.createTxn',
    }) as { db_id: DbId };

    const dbId = parseDbId(result.db_id);
    logger.info(literals.DB_ENTRY_CREATED(bridgeTxn.txnType, dbId));
    bridgeTxn.dbId = dbId;
    return dbId;
  }

  /**
   * Read a {@link BridgeTxn} from the database with its ID.
   *
   * @async
   * @param   {DbId} dbId - database primary key
   * @param   {TxnType} txnType - transaction type, will search in the corresponding table
   * @returns {Promise<DbItem[]>} promise of list of {@link DbItem} of the query result
   */
  public async readTxn(dbId: DbId, txnType: TxnType): Promise<DbItem> {
    // this should always be unique with a dbId
    const tableName = this._inferTableName(txnType);

    if (!this.isConnected) {
      await this.connect();
    }

    const query = `
      SELECT * FROM ${tableName} WHERE db_id = $1;
    `;
    const params = [dbId];
    const queryResult = await this.query(query, params);
    const result = this._verifyResultUniqueness(queryResult, {
      at: 'db.readTxn',
    }) as DbItem;
    return parseDbItem(result);
  }

  public async readAllTxn(txnType: TxnType): Promise<DbItem[]> {
    const tableName = this._inferTableName(txnType);

    // TODO: these 3 lines below needs refactor to a new decorator
    if (!this.isConnected) {
      await this.connect();
    }

    const query = `
      SELECT * FROM ${tableName};
    `;
    const dbItems = await this.query(query);
    return dbItems.map((dbItem) => parseDbItem(dbItem as DbItem));
  }
  /**
   * Update a {@link BridgeTxn} in the database. Only `txnStatus` and `toTxnId` can be updated.
   *
   * This action will update "request_status"(txnStatus) and "algo_txn_id"(toTxnId)
   * They are the only two fields that are allowed to change after created.
   * Will raise err if other fields mismatch.
   *
   * @async
   * @param  {BridgeTxn} bridgeTxn - the {@link BridgeTxn} to be updated in the database
   * @returns {Promise<DbId>} promise of the updated dbId
   */
  public async updateTxn(bridgeTxn: BridgeTxn): Promise<DbId> {
    // ensure bridgeTxn is created
    if (bridgeTxn.dbId === undefined) {
      throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_NOT_INITIALIZED, {
        at: 'updateTxn',
        why: 'dbId is undefined',
        bridgeTxn: bridgeTxn,
      });
    }

    const tableName = this._inferTableName(bridgeTxn.txnType);
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
    const queryResult = await this.query(query, params);

    const result = this._verifyResultUniqueness(queryResult, {
      bridgeTxn,
      at: 'db.updateTxn',
    }) as { db_id: DbId };

    logger.verbose(`Updated bridge txn with id ${bridgeTxn.dbId}`);
    return parseDbId(result.db_id);
  }

  /**
   * Read all {@link BridgeTxn} from the database with a `fromTxnId`. Result can be empty.
   *
   * @async
   * @param  {string} fromTxnId
   * @param  {TxnType} txnType
   * @returns {Promise<DbItem[]>} promise of the list of {@link DbItem} of the query result, list can be `[]`.
   */
  public async readTxnFromTxnId(
    fromTxnId: string,
    txnType: TxnType
  ): Promise<DbItem[]> {
    // next line: if txnType is null, _inferTableName will throw error.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tableName = this._inferTableName(txnType);

    if (!this.isConnected) {
      await this.connect();
    }

    const query = `
      SELECT * FROM ${tableName} WHERE from_txn_id = $1;
    `;
    const params = [fromTxnId];
    const result = await this.query(query, params);
    return result as DbItem[];
  }

  /* PRIVATE METHODS */

  /**
   * Unused for now.
   *
   * @async
   * @private
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.DB_UNAUTHORIZED_ACTION} if not connected
   * @param  {DbId} dbId
   * @param  {TxnType} txnType
   * @returns {Promise<void>} promise of `void`
   */
  private async deleteTxn(dbId: DbId, txnType: TxnType): Promise<void> {
    // never used.

    const query = `
      DELETE FROM ${this.mintTableName} WHERE id = $1;
    `;
    const params = [dbId];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await this.query(query, params);
    // return result
    throw new BridgeError(ERRORS.INTERNAL.DB_UNAUTHORIZED_ACTION, {
      action: 'deleteTxn',
      dbId,
      txnType,
    });
  }

  /**
   * infer the table name from a transaction type.
   *
   * @private
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.UNKNOWN_TXN_TYPE} if {@link txnType} is not valid
   * @param  {TxnType} txnType
   * @returns {TableName} table name
   */
  private _inferTableName(txnType: TxnType): TableName {
    let tableName: TableName;
    if (txnType === TxnType.MINT) {
      tableName = this.mintTableName;
      // for extendability, we can add more txn types here.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (txnType === TxnType.BURN) {
      tableName = this.burnTableName;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
        txnType,
      });
    }
    return tableName;
  }

  /**
   * Verify the length of the result is 1.
   *
   * @throws {BridgeError} - {@link ERRORS.EXTERNAL.DB_TXN_NOT_FOUND} if length is 0
   * @throws {BridgeError} - {@link ERRORS.EXTERNAL.DB_TXN_NOT_UNIQUE} if length is more than 1
   * @param  {unknown[]} result - query result to be verified
   * @param  {object} extraErrInfo? - extra error info
   * @returns {boolean} - true if result is not empty
   *
   * @todo change the object type
   */
  private _verifyResultUniqueness<T>(result: T[], extraErrInfo?: object): T {
    if (result.length === 0) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_TXN_NOT_FOUND, extraErrInfo);
    }
    if (result.length > 1) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_TXN_NOT_UNIQUE, extraErrInfo);
    }
    return result[0];
  }
}

const db = new Database(postgres, {
  mintTableName: TableName.MINT_TABLE_NAME,
  burnTableName: TableName.BURN_TABLE_NAME,
});
