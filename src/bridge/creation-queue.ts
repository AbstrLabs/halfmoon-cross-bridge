// TODO: add test
// TODO: merge two queues
// TODO+ There can be more queues, but it's not needed to separate them after the new DB model.

import { BlockchainName } from '..';
import { TxnId } from '../utils/type';

export { type CreationQueue, creationQueue };

// TODO: parse with zod, txnId type should meet fromBlockchain
interface TxnRequest {
  fromBlockchainName: BlockchainName;
  txnId: TxnId;
}
class CreationQueue {
  transactionQueue: TxnId[];

  constructor() {
    this.transactionQueue = [];
  }

  public add(txnRequest: TxnRequest) {
    if (this._has(txnRequest)) {
      throw new Error(
        'Txn already in creation queue ' +
          txnRequest.txnId +
          txnRequest.fromBlockchainName
      );
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

const creationQueue = new CreationQueue();
