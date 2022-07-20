/**
 * A singleton responsible for converting API call to initialized and
 * uploaded BridgeTxn.
 */
export { type ApiWorker, apiWorker };

import {
  ApiCallParam,
  CriticalApiCallParam,
  parseCriticalApiCallParam,
} from '../utils/type/type';
import { BridgeTxn } from '../bridge';
import { logger } from '../utils/logger';
import ObjectSet from 'object-set-type';

class ApiWorker {
  /* private */ #queue: ObjectSet<CriticalApiCallParam> =
    new ObjectSet<CriticalApiCallParam>();

  /**
   * Create a BridgeTxn from API call params checking double mint from both RAM and DB.
   *
   * @param apiCallParam - API call param
   * @returns
   */
  public async create(apiCallParam: ApiCallParam) {
    const criticalApiCallParam: CriticalApiCallParam =
      parseCriticalApiCallParam(apiCallParam);

    if (this._has(criticalApiCallParam)) {
      throw new Error(
        'Txn already in creation queue ' + criticalApiCallParam.txn_id
      );
    }
    this._add(criticalApiCallParam);

    const bridgeTxn = BridgeTxn.fromApiCallParam(
      apiCallParam,
      BigInt(Date.now()) // maybe use frontend time instead of server time
    );

    try {
      // BTX.createInDb compares BTX.fromTxnId with DbItem.from_txn_id and wil throw err
      await bridgeTxn.createInDb();
      // TBD1: should we add more coupling to save execution time?
      // bridgeWorker.addTask(bridgeTxn);
    } catch (err) {
      logger.error('[AWK]: Double mint: from_txn_id existed in db.');
      logger.error(err);
      throw err;
    } finally {
      apiWorker._delete(criticalApiCallParam);
    }
    logger.verbose(
      `[ApiWorker]: bridge txn created with uid: ${bridgeTxn.uid.toString()}`
    );

    return bridgeTxn;
  }

  private _delete(criticalApiCallParam: CriticalApiCallParam) {
    if (!this._has(criticalApiCallParam)) {
      throw new Error('Txn not in creation queue');
    }

    return this.#queue.delete(criticalApiCallParam);
  }

  /* GETTERS & SETTER */

  public get size() {
    return this.#queue.size;
  }
  public get length() {
    return this.size;
  }

  /* PRIVATE METHOD */

  private _has(criticalApiCallParam: CriticalApiCallParam) {
    return this.#queue.has(criticalApiCallParam);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  }
  private _add(criticalApiCallParam: CriticalApiCallParam) {
    this.#queue.add(criticalApiCallParam);
  }
}

const apiWorker = new ApiWorker();
