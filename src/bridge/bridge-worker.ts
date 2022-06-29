// TODO: add test

import { TxnType } from '../blockchain';
import { TxnId, TxnUid } from '../utils/type';

export { type BridgeWorker, bridgeWorker };

// TODO: parse with zod
interface CriticalApiCallParam {
  type: TxnType;
  txnId: TxnId;
}

class BridgeWorker {
  creationQueue: CriticalApiCallParam[]; // not in DB.
  txnQueue: TxnUid[]; // sync with DB.
  threadNumber: number;

  constructor(threadNumber = 1) {
    this.threadNumber = threadNumber;
    this.creationQueue = [];
    this.txnQueue = [];
  }

  // public create() {}

  public add(criticalApiCallParam: CriticalApiCallParam) {
    if (this._has(criticalApiCallParam)) {
      throw new Error(
        'Txn already in creation queue ' + criticalApiCallParam.txnId
      );
    }
    this._push(criticalApiCallParam);
    return true;
  }

  public remove(criticalApiCallParam: CriticalApiCallParam) {
    if (!this._has(criticalApiCallParam)) {
      throw new Error('Txn not in creation queue');
    }

    this.creationQueue = this.creationQueue.filter(
      (ExistedTxnRequest) =>
        ExistedTxnRequest.txnId !== criticalApiCallParam.txnId
    );
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return true;
  }

  public get length() {
    return this.creationQueue.length;
  }

  private _has(criticalApiCallParam: CriticalApiCallParam) {
    return this.creationQueue.includes(criticalApiCallParam);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  }
  private _push(criticalApiCallParam: CriticalApiCallParam) {
    this.creationQueue.push(criticalApiCallParam);
  }
}

const bridgeWorker = new BridgeWorker();
