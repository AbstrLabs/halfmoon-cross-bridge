import { BridgeTxn, BridgeTxnObj } from '.';
import { creationQueue, type CreationQueue } from './creation-queue';

export { TxnHandler };
class TxnHandler {
  queue: CreationQueue;
  constructor() {
    this.queue = creationQueue;
  }
  /* private */ async _execute(bridgeTxn: BridgeTxn): Promise<BridgeTxnObj> {
    return await bridgeTxn.runWholeBridgeTxn();
  }
  /* async  */ loadUnfinishedTasksFromDb() {
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

  get length(): number {
    return this.queue.length;
  }
  get tasksNum(): number {
    return this.length;
  }
  get queueLength(): number {
    return this.length;
  }
}
