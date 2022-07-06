/** A singleton responsible for converting API call to initialized and
 * uploaded BridgeTxn.
 */
export { type ApiWorker, apiWorker };

import { TxnType } from '../blockchain';
import { ApiCallParam, TxnId } from '../utils/type';
import { BridgeTxn } from '../bridge';
import { logger } from '../utils/logger';

// TODO: parse with zod
interface CriticalApiCallParam {
  type: TxnType;
  txnId: TxnId;
}

class ApiWorker {
  /* private */ queue: CriticalApiCallParam[];

  constructor() {
    this.queue = [];
  }

  public async create(apiCallParam: ApiCallParam) {
    // TODO: zod parse
    // TODO: only use fields in critical api call param
    const criticalApiCallParam: CriticalApiCallParam = apiCallParam;

    if (this._includes(criticalApiCallParam)) {
      throw new Error(
        'Txn already in creation queue ' + criticalApiCallParam.txnId
      );
    }
    this._push(criticalApiCallParam);

    const bridgeTxn = BridgeTxn.fromApiCallParam(
      apiCallParam,
      BigInt(Date.now())
    );

    // TODO: compare then create
    await bridgeTxn.createInDb();

    // TODO: should we add more coupling to save execution time?
    // bridgeWorker._push(bridgeTxn);

    apiWorker._remove(criticalApiCallParam);

    logger.verbose(
      `[ApiWorker]: bridge txn created with uid: ${bridgeTxn.uid.toString()}`
    );

    return bridgeTxn;
  }

  private _remove(criticalApiCallParam: CriticalApiCallParam) {
    if (!this._includes(criticalApiCallParam)) {
      throw new Error('Txn not in creation queue');
    }

    this.queue = this.queue.filter(
      (ExistedCallParam) =>
        ExistedCallParam.txnId !== criticalApiCallParam.txnId
    );
    return true;
  }
  /* GETTERS & SETTERs */
  public get length() {
    return this.queue.length;
  }

  /* PRIVATE METHODS */

  private _includes(criticalApiCallParam: CriticalApiCallParam) {
    return this.queue.includes(criticalApiCallParam);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  }
  private _push(criticalApiCallParam: CriticalApiCallParam) {
    this.queue.push(criticalApiCallParam);
  }
}

const apiWorker = new ApiWorker();
