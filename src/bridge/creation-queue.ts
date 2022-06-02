// TODO: add test

import { BlockchainName } from '..';
import { AlgoTxnId, NearTxnId, TxnId } from '../utils/type';

export { type CreationQueue, creationQueue };

// TODO: parse with zod, txnId type should meet fromBlockchain
interface TxnRequest {
  fromBlockchain: BlockchainName;
  txnId: TxnId;
}
class CreationQueue {
  algorandQueue: AlgoTxnId[];
  nearQueue: NearTxnId[];

  constructor() {
    this.algorandQueue = [];
    this.nearQueue = [];
  }

  public add(txnRequest: TxnRequest) {
    if (this._has(txnRequest)) {
      return false;
    }
    this._push(txnRequest);
    return true;
  }

  public _has(txnRequest: TxnRequest) {
    if (txnRequest.fromBlockchain === BlockchainName.ALGO) {
      return this.algorandQueue.includes(txnRequest.txnId);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (txnRequest.fromBlockchain === BlockchainName.NEAR) {
      return this.nearQueue.includes(txnRequest.txnId);
    } else {
      throw new Error('Invalid blockchain name');
    }
  }
  private _push(txnRequest: TxnRequest) {
    if (txnRequest.fromBlockchain === BlockchainName.ALGO) {
      this.algorandQueue.push(txnRequest.txnId);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (txnRequest.fromBlockchain === BlockchainName.NEAR) {
      this.nearQueue.push(txnRequest.txnId);
    } else
      () => {
        throw new Error('Invalid blockchain name');
      };
  }
}

const creationQueue = new CreationQueue();
