/**
 * Export a singleton instance `db` to handle all database requests
 */

export { db };
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async query(query: string, params: any[] = []): Promise<any[]> {
    return await this.instance.query(query, params);
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
    this._verifyResultUniqueness(result, { bridgeTxn });

    const dbId = parseDbId(result[0].db_id);
    logger.info(literals.DB_ENTRY_CREATED(bridgeTxn.getTxnType(), dbId));
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
  public async readTxn(dbId: DbId, txnType: TxnType): Promise<DbItem[]> {
    // next line: if null, will throw error.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tableName = this._inferTableName(txnType);

    if (!this.isConnected) {
      await this.connect();
    }

    const query = `
      SELECT * FROM ${tableName} WHERE db_id = $1;
    `;
    const params = [dbId];
    const result = await this.query(query, params);
    return result;
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
    // next line: if null, will throw error.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tableName = this._inferTableName(bridgeTxn.getTxnType());
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

    this._verifyResultUniqueness(result, { bridgeTxn });

    logger.verbose(`Updated bridge txn with id ${bridgeTxn.dbId}`);
    return parseDbId(result[0].db_id);
  }

  /**
   * Read a unique {@link BridgeTxn} from the database with its database primary key.
   *
   * @async
   * @param  {DbId} dbId - database primary key
   * @param  {TxnType} txnType - transaction type, will search in the corresponding table
   * @returns {Promise<DbItem>} promise of the unique {@link DbItem} of the query result
   */
  public async readUniqueTxn(dbId: DbId, txnType: TxnType): Promise<DbItem> {
    // currently only used in test. not fixing.
    // should return an BridgeTxn
    // should use BridgeTxn.fromDbItem to convert to BridgeTxn

    const result = await this.readTxn(dbId, txnType);
    this._verifyResultUniqueness(result, { dbId });
    const dbItem = parseDbItem(result[0]);
    return dbItem;
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
    return result;
  }

  /* PRIVATE METHODS */

  /**
   * Unused for now.
   *
   * @async
   * @private
   * @param  {DbId} dbId
   * @param  {TxnType} txnType
   * @returns {Promise<void>} promise of `void`
   */
  private async deleteTxn(dbId: DbId, txnType: TxnType): Promise<void> {
    // never used.

    // const query = `
    //   DELETE FROM ${this.mintTableName} WHERE id = $1;
    // `;
    // const params = [dbId];
    // const result = await this.query(query, params);
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
   * @param  {TxnType} txnType
   * @returns {TableName} table name
   */
  private _inferTableName(txnType: TxnType): TableName {
    let tableName: TableName;
    if (txnType === TxnType.MINT) {
      tableName = this.mintTableName;
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
   * @param  {unknown[]} result - query result to be verified
   * @param  {object} extraErrInfo? - extra error info
   * @returns {boolean} - true if result is not empty
   */
  private _verifyResultUniqueness(
    result: unknown[],
    extraErrInfo?: object
  ): boolean {
    if (result.length === 0) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_TXN_NOT_FOUND, extraErrInfo);
    }
    if (result.length > 1) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_TXN_NOT_UNIQUE, extraErrInfo);
    }
    return true;
  }
}

const db = new Database(postgres, {
  mintTableName: TableName.MINT_TABLE_NAME,
  burnTableName: TableName.BURN_TABLE_NAME,
});
