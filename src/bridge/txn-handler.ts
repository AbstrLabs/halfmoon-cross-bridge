import { BridgeTxn } from './bridge-txn';
import { creationQueue, type CreationQueue } from './creation-queue';

export { TxnHandler };
class TxnHandler {
  queue: CreationQueue;
  constructor() {
    this.queue = creationQueue;
  }
  /* private */ async _execute(bridgeTxn: BridgeTxn) {
    await bridgeTxn.runWholeBridgeTxn();
  }
  /* async  */ loadQueueUnfinishedFromDb() {
    throw new Error('Function not implemented.');
  }

  /* async  */ addTask() {
    throw new Error('Function not implemented.');
  }
  /* async  */ handleTask() {
    throw new Error('Function not implemented.');
  }
  /* async  */ removeTask() {
    throw new Error('Function not implemented.');
  }
  get length() {
    throw new Error('Function not implemented.');
    // return this.queue.length;
    // TODO CreationQueue.length = sum of all queues
  }
}
