/** A singleton responsible for converting API call to initialized and
 * uploaded BridgeTxn.
 */
export { type ApiWorker, apiWorker };

import { TxnType } from '../blockchain';
import { TxnId } from '../utils/type';

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

  public plan(criticalApiCallParam: CriticalApiCallParam) {
    // TODO: zod parse
    // TODO: only use fields in critical api call param
    if (this._includes(criticalApiCallParam)) {
      throw new Error(
        'Txn already in creation queue ' + criticalApiCallParam.txnId
      );
    }
    this._push(criticalApiCallParam);
    return true;
  }

  public remove(criticalApiCallParam: CriticalApiCallParam) {
    if (!this._includes(criticalApiCallParam)) {
      throw new Error('Txn not in creation queue');
    }

    this.queue = this.queue.filter(
      (ExistedCallParam) =>
        ExistedCallParam.txnId !== criticalApiCallParam.txnId
    );
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
