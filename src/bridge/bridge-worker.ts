// TODO: add test

import { TxnUid } from '../utils/type';

export { type BridgeWorker, bridgeWorker };

class BridgeWorker {
  txnQueue: TxnUid[]; // sync with DB.
  threadNumber: number;

  constructor(threadNumber = 1) {
    // JS is single-threaded.
    // + Thread here means how many task in the heap will be executed
    // at the same time. Using 1 for now.
    this.threadNumber = threadNumber;
    this.txnQueue = [];
  }
}

const bridgeWorker = new BridgeWorker();
