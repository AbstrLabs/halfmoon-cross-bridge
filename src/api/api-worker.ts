/**
 * A singleton responsible for converting API call to initialized and
 * uploaded BridgeTxn.
 */
export { type ApiWorker, apiWorker };

import { BridgeTxn } from '../bridge';
import ObjectSet from 'object-set-type';
import { log } from '../utils/log/log-template';
import { logger } from '../utils/log/logger';
import {
  ApiCallParam,
  parseCriticalApiCallParam,
  CriticalApiCallParam,
} from '../common/src/type/api';

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
    if (this._has(apiCallParam)) {
      logger.error(`Txn already in creation queue ${apiCallParam.txn_id}`);
      throw new Error(`Txn already in creation queue ${apiCallParam.txn_id}`);
    }
    this._add(apiCallParam);

    const bridgeTxn = BridgeTxn.fromApiCallParam(
      apiCallParam,
      BigInt(Date.now()) // maybe use frontend time instead of server time
    );

    try {
      // BTX.createInDb compares BTX.fromTxnId with DbItem.from_txn_id and wil throw err
      await bridgeTxn.createInDb();
      // TBD1: less coupling vs less execution cost (to fetch db)?
      // bridgeWorker.addTask(bridgeTxn);
    } catch (err) {
      log.APIW.doubleMintError(err);
      throw err;
    } finally {
      apiWorker._delete(apiCallParam);
    }
    log.APIW.apiWorkerCreatedBridgeTxn(bridgeTxn.uid);
    return bridgeTxn;
  }

  private _delete(criticalApiCallParam: CriticalApiCallParam) {
    if (!this._has(parseCriticalApiCallParam(criticalApiCallParam))) {
      throw new Error('Txn not in creation queue');
    }

    return this.#queue.delete(parseCriticalApiCallParam(criticalApiCallParam));
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
    return this.#queue.has(parseCriticalApiCallParam(criticalApiCallParam));
  }
  private _add(criticalApiCallParam: CriticalApiCallParam) {
    this.#queue.add(parseCriticalApiCallParam(criticalApiCallParam));
  }
}

const apiWorker = new ApiWorker();
