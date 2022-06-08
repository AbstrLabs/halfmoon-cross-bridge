// TODO: add test

import { BlockchainName } from '..';
import { AlgoTxnId, NearTxnId, TxnId } from '../utils/type';

export { type CreationQueue, creationQueue };

// TODO: parse with zod, txnId type should meet fromBlockchain
interface TxnRequest {
  fromBlockchainName: BlockchainName;
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

    if (txnRequest.fromBlockchainName === BlockchainName.ALGO) {
      this.algorandQueue = this.algorandQueue.filter(
        (txnId) => txnId !== txnRequest.txnId
      );
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (txnRequest.fromBlockchainName === BlockchainName.NEAR) {
      this.nearQueue = this.nearQueue.filter(
        (txnId) => txnId !== txnRequest.txnId
      );
    } else {
      throw new Error('Invalid blockchain name');
    }

    return true;
  }

  public get length() {
    return this.algorandQueue.length + this.nearQueue.length;
  }

  private _has(txnRequest: TxnRequest) {
    if (txnRequest.fromBlockchainName === BlockchainName.ALGO) {
      return this.algorandQueue.includes(txnRequest.txnId);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (txnRequest.fromBlockchainName === BlockchainName.NEAR) {
      return this.nearQueue.includes(txnRequest.txnId);
    } else {
      throw new Error('Invalid blockchain name');
    }
  }
  private _push(txnRequest: TxnRequest) {
    if (txnRequest.fromBlockchainName === BlockchainName.ALGO) {
      this.algorandQueue.push(txnRequest.txnId);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (txnRequest.fromBlockchainName === BlockchainName.NEAR) {
      this.nearQueue.push(txnRequest.txnId);
    } else
      () => {
        throw new Error('Invalid blockchain name');
      };
  }
}

const creationQueue = new CreationQueue();
