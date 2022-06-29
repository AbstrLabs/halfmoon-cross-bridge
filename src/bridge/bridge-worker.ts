/**
 * A worker to handle transactions with a queue.
 */
import { BridgeTxn, BridgeTxnObj } from '.';
import { BridgeTxnStatusTree } from '..';
import { db, type Database } from '../database/db';
import { emailServer } from '../server/email';
import { logger } from '../utils/logger';

export { type TxnHandler, txnHandler };

class TxnHandler {
  queue: BridgeTxn[];
  database: Database;

  constructor(database = db) {
    this.queue = [];
    this.database = database;
  }

  /**
   * @deprecated use handleTasks() instead.
   */
  /* private */ async _execute(bridgeTxn: BridgeTxn): Promise<BridgeTxnObj> {
    logger.warn('calling a methods that should be private');
    // only handles fresh-new task
    return await bridgeTxn.runWholeBridgeTxn();
    // TODO: support BridgeTxn with more txnStatus
  }

  async loadUnfinishedTasksFromDb() {
    // TODO: prune DB.
    const allDbItems = await this.database.readAllTxn();
    const allBridgeTxns = allDbItems.map((item) => BridgeTxn.fromDbItem(item));
    const unfinishedBridgeTxns = allBridgeTxns.filter(
      (txn) => BridgeTxnStatusTree[txn.txnStatus].actionName !== null
    );
    unfinishedBridgeTxns.map((txn) => this._push(txn));
  }

  /**
   * Fetch newly added tasks from the database.
   * loadUnfinishedTasksFromDb can merge into this
   *
   * @param  {Database} db
   *
   * @returns {Promise<void>}
   */
  async updateTasksFromDb(): Promise<void> {
    // get all unfinished txn
    // for txn, run updateTask
  }

  async updateTask(/* bridgeTxn: BridgeTxn */) {
    // get current with bridgeTxn.uid
    // if txn.txnStatus > current, (need partial order on txnStatus)
    // then update current to txn
  }

  async handleTasks() {
    for (const bridgeTxn of this.queue) {
      await this.handleTask(bridgeTxn);
    }
  }

  public async run() {
    await this.loadUnfinishedTasksFromDb();
    await this.handleTasks();
    setInterval(() => {
      throw new Error(`Function not implemented.`);
      // this.updateTasksFromDb(db);
    }, 1_000);
  }

  addTask(bridgeTxn: BridgeTxn) {
    this._push(bridgeTxn);
  }

  /* GETTERS & SETTERS */
  get length(): number {
    return this.queue.length;
  }
  get taskNum(): number {
    return this.length;
  }
  get queueLength(): number {
    return this.length;
  }

  toString() {
    return JSON.stringify(this.queue);
  }

  /* PRIVATE METHODS */

  private _push(bridgeTxn: BridgeTxn) {
    if (this._hasTask(bridgeTxn)) {
      throw new Error('task already exists in TxnHandler queue');
    }
    this.queue.push(bridgeTxn);
  }

  private async handleTask(bridgeTxn: BridgeTxn) {
    const actionName = BridgeTxnStatusTree[bridgeTxn.txnStatus].actionName;
    if (actionName === 'MANUAL') {
      emailServer.sendErrEmail(bridgeTxn.uid, bridgeTxn.toObject());
      this.removeTask(bridgeTxn);
      return;
    }
    if (actionName === null) {
      throw new Error(
        `actionName is null for ${bridgeTxn.uid} no action's needed.`
      );
    }
    await bridgeTxn[actionName]();
  }

  /* private async */ removeTask(bridgeTxn: BridgeTxn) {
    throw new Error(
      `Function not implemented. ${bridgeTxn.uid} is not removed`
    );
  }

  private _hasTask(bridgeTxn: BridgeTxn): boolean {
    return this.queue.includes(bridgeTxn); // TODO: should compare UID here.
  }
}

const txnHandler = new TxnHandler(db);
