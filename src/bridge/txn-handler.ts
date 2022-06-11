/**
 * A worker to handle transactions with a queue.
 */
import { BridgeTxn, BridgeTxnObj } from '.';
import { TxnType } from '../blockchain';
import { type Database } from '../database/db';
import { logger } from '../utils/logger';

export { type TxnHandler, txnHandler };

class TxnHandler {
  queue: BridgeTxn[];
  constructor() {
    this.queue = [];
  }
  /* private */ async _execute(bridgeTxn: BridgeTxn): Promise<BridgeTxnObj> {
    logger.warn('calling a methods that should be private');
    // only handles fresh-new task
    return await bridgeTxn.runWholeBridgeTxn();
    // TODO: support BridgeTxn with more txnStatus
  }
  async loadUnfinishedTasksFromDb(db: Database) {
    const mintDbItems = await db.readAllTxn(TxnType.MINT);
    const burnDbItems = await db.readAllTxn(TxnType.BURN);
    for (const mintDbItem of mintDbItems) {
      this.queue.push(BridgeTxn.fromDbItem(mintDbItem, TxnType.MINT));
    }
    for (const burnDbItem of burnDbItems) {
      this.queue.push(BridgeTxn.fromDbItem(burnDbItem, TxnType.BURN));
    }
    // TODO! check repeated tasks, test, filter finished / error tasks.
    // TODO+ need a func for both arr.
  }

  /**
   * Fetch newly added tasks from the database.
   * loadUnfinishedTasksFromDb can merge into this
   *
   * @param  {Database} db
   *
   * @returns {Promise<void>}
   */
  async updateTasksFromDb(db: Database): Promise<void> {
    const mintDbItems = await db.readAllTxn(TxnType.MINT);
    const burnDbItems = await db.readAllTxn(TxnType.BURN);
    for (const mintDbItem of mintDbItems) {
      const bridgeTxn = BridgeTxn.fromDbItem(mintDbItem, TxnType.MINT);
      if (!this._hasTask(bridgeTxn)) {
        this.queue.push(bridgeTxn);
      }
    }
    for (const burnDbItem of burnDbItems) {
      const bridgeTxn = BridgeTxn.fromDbItem(burnDbItem, TxnType.BURN);
      if (!this._hasTask(bridgeTxn)) {
        this.queue.push(bridgeTxn);
      }
    }
  }

  async handleTasks() {
    for (const bridgeTxn of this.queue) {
      await this._execute(bridgeTxn);
    }
  }

  // public run() {
  //   this.handleTask();
  // }

  addTask(bridgeTxn: BridgeTxn) {
    if (this._hasTask(bridgeTxn)) {
      throw new Error('task already exists in TxnHandler queue');
    }
    this.queue.push(bridgeTxn);
  }
  /* private async */ handleTask() {
    throw new Error('Function not implemented.');
  }
  /* private async */ removeTask() {
    throw new Error('Function not implemented.');
  }

  private _hasTask(bridgeTxn: BridgeTxn): boolean {
    return this.queue.includes(bridgeTxn); // TODO: should compare UID here.
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
