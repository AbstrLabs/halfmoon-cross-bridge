// TODO: add test

import { BlockchainName } from '..';
import { TxnId, TxnUid } from '../utils/type';

export { type BridgeWorker, bridgeWorker };

// TODO: UID: parse with zod, txnUid type should be uid format
interface TxnRequest {
  txnId: TxnId;
  fromBlockchainName: BlockchainName;
}

class BridgeWorker {
  creationQueue: TxnRequest[]; // not in DB.
  transactionQueue: TxnUid[]; // sync with DB.
  threadNumber: number;

  constructor(threadNumber = 1) {
    this.threadNumber = threadNumber;
    this.creationQueue = [];
    this.transactionQueue = [];
  }

  public add(txnRequest: TxnRequest) {
    if (this._has(txnRequest)) {
      throw new Error('Txn already in creation queue ' + txnRequest.txnId);
    }
    this._push(txnRequest);
    return true;
  }

  public remove(txnRequest: TxnRequest) {
    if (!this._has(txnRequest)) {
      throw new Error('Txn not in creation queue');
    }

    this.transactionQueue = this.transactionQueue.filter(
      (txnId) => txnId !== txnRequest.txnId
    );
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return true;
  }

  public get length() {
    return this.transactionQueue.length;
  }

  private _has(txnRequest: TxnRequest) {
    return this.transactionQueue.includes(txnRequest.txnId);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  }
  private _push(txnRequest: TxnRequest) {
    this.transactionQueue.push(txnRequest.txnId);
  }
}

const bridgeWorker = new BridgeWorker();
