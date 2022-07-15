/**
 * Export a singleton instance `db` to handle all database requests
 *
 * @todo ref: check this.isConnected with decorator.
 */

export { db, type Database };
import { BridgeError, ERRORS } from '../utils/errors';

import { type BridgeTxn } from '../bridge';
import {
  type DbId,
  type DbItem,
  parseDbItem,
  parseDbId,
} from '../utils/type/type';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';
import { type Postgres, postgres } from './aws-rds';
import { ENV } from '../utils/dotenv';
import { NodeEnvEnum } from '..';

let _TABLE_NAME;
if (
  ENV.NODE_ENV === NodeEnvEnum.DEVELOPMENT ||
  ENV.NODE_ENV === NodeEnvEnum.TEST
) {
  _TABLE_NAME = 'request_dev';
  logger.info('[DB ]: using development database');
} else if (ENV.NODE_ENV === NodeEnvEnum.PRODUCTION) {
  _TABLE_NAME = 'request_test';
  logger.info('[DB ]: using testnet database');
} else {
  throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_NODE_ENV, {
    current_ENV: ENV.NODE_ENV,
  });
}
const TABLE_NAME = _TABLE_NAME as NodeEnvEnum;

/**
 * A database class to handle all database requests. Should be used as a singleton.
 */
class Database {
  private instance;
  private requestTableName;

  /**
   *
   *
   * @param instance - An instance of {@link Postgres}
   */
  constructor(instance: Postgres) {
    this.instance = instance;
    this.requestTableName = TABLE_NAME;
  }

  /**
   * Wrapped getter of isConnected.
   *
   * @returns Boolean if db is connected, false otherwise
   */
  get isConnected(): boolean {
    return this.instance.isConnected;
  }

  /**
   * Connects to the database.
   *
   * @returns Promise of void
   */
  async connect(): Promise<void> {
    await this.instance.connect();
  }

  /**
   * Generic database query method.
   *
   * @param query - SQL query string
   * @param params - SQL query parameters
   * @returns Promise of query result
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
        requestTableName: this.requestTableName,
        err,
        query,
        params,
      });
    }
  }

  /**
   * Disconnects pool thread from the database.
   */
  disconnect(): void {
    this.instance.disconnect();
  }

  /**
   * Stop the database pool.
   *
   * @returns Promise of void
   */
  async end(): Promise<void> {
    await this.instance.end();
  }

  /**
   * Create a new {@link BridgeTxn} in the database.
   *
   * @param bridgeTxn - A {@link BridgeTxn} to be inserted into the database
   * @returns Promise of {@link D8bId} of the created {@link BridgeTxn}
   */
  public async createTxn(bridgeTxn: BridgeTxn): Promise<DbId> {
    // will assign and return a dbId on creation.
    if (!this.isConnected) {
      logger.error('db is not connected while it should be');
      await this.connect();
    }
    // const bridgeTxnObj = bridgeTxn.toObject();
    const query = `
      INSERT INTO ${this.requestTableName} 
      (
        txn_status, 
        from_addr, from_amount_atom, from_token_id, from_txn_id,
        to_addr, to_amount_atom, to_token_id, to_txn_id,
        created_time, fixed_fee_atom, margin_fee_atom,
        txn_comment
      ) 
      VALUES (
        $1,
        $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12,
        $13
      ) 
      RETURNING db_id;
    `;
    const params: (string | bigint | undefined | null)[] = [
      bridgeTxn.txnStatus,
      bridgeTxn.fromAddr,
      bridgeTxn.fromAmountAtom,
      bridgeTxn.fromTokenId,
      bridgeTxn.fromTxnId,
      bridgeTxn.toAddr,
      bridgeTxn.toAmountAtom,
      bridgeTxn.toTokenId,
      bridgeTxn.toTxnId,
      bridgeTxn.createdTime,
      bridgeTxn.fixedFeeAtom,
      bridgeTxn.marginFeeAtom,
      bridgeTxn.txnComment,
    ];
    const queryResult = await this.query(query, params);
    const result = this._verifyResultUniqueness(queryResult, {
      bridgeTxn: bridgeTxn,
      at: 'db.createTxn',
    }) as { db_id: DbId };

    const dbId = parseDbId(result.db_id);
    bridgeTxn.dbId = dbId;
    logger.info(
      literals.DB_ENTRY_CREATED(this.requestTableName, bridgeTxn.uid)
    );
    return dbId;
  }

  /**
   * Read a {@link BridgeTxn} from the database with its ID.
   * @throws if the database query result was not unique
   * @throws if the database query failed

   * @param dbId - database primary key
   * @returns Promise of list of {@link DbItem} of the query result
   */
  public async readTxn(dbId: DbId): Promise<DbItem> {
    // this should always be unique with a dbId

    if (!this.isConnected) {
      await this.connect();
    }

    const query = `
      SELECT * FROM ${this.requestTableName} WHERE db_id = $1;
    `;
    const params = [dbId];
    const queryResult = await this.query(query, params);
    const result = this._verifyResultUniqueness(queryResult, {
      at: 'db.readTxn',
    }) as DbItem;
    return parseDbItem(result);
  }

  public async readAllTxn(): Promise<DbItem[]> {
    // TODO: these 3 lines below needs refactor to a new decorator
    if (!this.isConnected) {
      await this.connect();
    }

    const query = `
      SELECT * FROM ${this.requestTableName};
    `;
    const dbItems = await this.query(query);

    logger.silly(
      `[DB ]: readAllTxn: fetched ${dbItems.length} items:\n ${JSON.stringify(
        dbItems
      )}`
    );
    // parseDbItem for validation
    return dbItems.map((dbItem) => parseDbItem(dbItem as DbItem));
  }
  /**
   * Update a {@link BridgeTxn} in the database. Only `txnStatus` and `toTxnId` can be updated.
   *
   * This action will update "request_status"(txnStatus) and "algo_txn_id"(toTxnId)
   * They are the only two fields that are allowed to change after created.
   * Will raise err if other fields mismatch.
   *
   * @param bridgeTxn - the {@link BridgeTxn} to be updated in the database
   * @returns Promise of the updated dbId
   */
  public async updateTxn(bridgeTxn: BridgeTxn): Promise<DbId> {
    // ensure bridgeTxn is created
    if (bridgeTxn.dbId === undefined) {
      throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_NOT_INITIALIZED, {
        at: 'updateTxn',
        why: 'dbId should be defined if txn is in database',
        bridgeTxn: bridgeTxn,
      });
    }

    if (!this.isConnected) {
      await this.connect();
    }
    // todo: separate this txnStatus and toTxnId update into 2 separate queries
    const query = `
      UPDATE ${this.requestTableName} SET
        txn_status=$2, to_txn_id = $10
          WHERE (
            db_id=$1
            -- AND txn_status=$2
            AND from_addr=$3
            AND from_amount_atom=$4
            AND from_token_id=$5
            AND from_txn_id=$6
            AND to_addr=$7
            AND to_amount_atom=$8
            AND to_token_id=$9
            -- AND to_txn_id=$10
            AND created_time=$11
            AND fixed_fee_atom=$12
            AND margin_fee_atom=$13
            -- AND txn_comment=$14
          )
      RETURNING db_id;
    `;
    const params = [
      bridgeTxn.dbId,
      bridgeTxn.txnStatus,
      bridgeTxn.fromAddr,
      bridgeTxn.fromAmountAtom,
      bridgeTxn.fromTokenId,
      bridgeTxn.fromTxnId,
      bridgeTxn.toAddr,
      bridgeTxn.toAmountAtom,
      bridgeTxn.toTokenId,
      bridgeTxn.toTxnId,
      bridgeTxn.createdTime,
      bridgeTxn.fixedFeeAtom,
      bridgeTxn.marginFeeAtom,
      // bridgeTxn.txnComment,
    ];
    const queryResult = await this.query(query, params);

    const result = this._verifyResultUniqueness(queryResult, {
      bridgeTxn,
      at: 'db.updateTxn',
      queryResult,
      query,
      params,
    }) as { db_id: DbId };

    logger.debug(
      `[DB ]: Updated bridge txn with dbId ${bridgeTxn.dbId} to ${bridgeTxn.txnStatus}`
    );
    return parseDbId(result.db_id);
  }

  /**
   * Read all {@link BridgeTxn} from the database with a `fromTxnId`. Result can be empty.
   *
   * @param fromTxnId - the `fromTxnId` of the {@link BridgeTxn} to be read
   * @returns Promise of the list of {@link DbItem} of the query result, list can be `[]`.
   */
  public async readTxnFromTxnId(fromTxnId: string): Promise<DbItem[]> {
    if (!this.isConnected) {
      await this.connect();
    }

    const query = `
      SELECT * FROM ${this.requestTableName} WHERE from_txn_id = $1;
    `;
    const params = [fromTxnId];
    const result = await this.query(query, params);
    return result as DbItem[];
  }

  /* PRIVATE METHODS */

  /**
   * Unused for now.
   *
   * @internal
   * @throws {@link ERRORS.INTERNAL.DB_UNAUTHORIZED_ACTION} if not connected
   * @param dbId - the primary key of table
   * @returns Promise of void
   */
  private async deleteTxn(dbId: DbId): Promise<void> {
    // never used.

    const query = `
      DELETE FROM ${this.requestTableName} WHERE id = $1;
    `;
    const params = [dbId];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await this.query(query, params);
    // return result
    throw new BridgeError(ERRORS.INTERNAL.DB_UNAUTHORIZED_ACTION, {
      action: 'deleteTxn',
      dbId,
    });
  }

  /**
   * Verify the length of the result is 1.
   *
   * @throws {@link ERRORS.EXTERNAL.DB_TXN_NOT_FOUND} if length is 0
   * @throws {@link ERRORS.EXTERNAL.DB_TXN_NOT_UNIQUE} if length is more than 1
   * @param result - Query result to be verified of type unknown[]
   * @param extraErrInfo - extra error info
   * @returns boolean if result is not empty
   * @deprecated - should use decorator (not finished)
   *
   * @todo change the object type
   * @todo use decorator
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

const db = new Database(postgres);
