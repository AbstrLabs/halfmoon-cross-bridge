/**
 * A worker to handle transactions with a queue.
 */
import { BridgeTxn, BridgeTxnObj } from '.';
import { logger } from '../utils/logger';

export { type TxnHandler, txnHandler };

class TxnHandler {
  queue: BridgeTxn[];
  constructor() {
    this.queue = [];
  }
  /* private */ async _execute(bridgeTxn: BridgeTxn): Promise<BridgeTxnObj> {
    logger.warn('calling a methods that should be private');
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
  get taskNum(): number {
    return this.length;
  }
  get queueLength(): number {
    return this.length;
  }
}

const txnHandler = new TxnHandler();
