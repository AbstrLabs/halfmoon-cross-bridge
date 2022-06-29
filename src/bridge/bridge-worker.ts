/**
 * A worker to handle transactions with a queue.
 */
import { BridgeTxn, BridgeTxnObj } from '.';
import { BridgeTxnStatusEnum, BridgeTxnStatusTree } from '..';
import { db, type Database } from '../database/db';
import { emailServer } from '../server/email';
import { pause } from '../utils/helper';
import { logger } from '../utils/logger';

export { type BridgeWorker, bridgeWorker };

// TODO: add this to setting (maybe .env)
const EXECUTE_INTERVAL_MS = 1_000;
const UPDATE_INTERVAL_MS = 5_000;

class BridgeWorker {
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

  async handleNewTask() {
    const newTask = this._pop();
    if (newTask === undefined) {
      return;
    }
    await this.handleTask(newTask);
  }

  public async run() {
    await this.loadUnfinishedTasksFromDb();
    // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
    while (true) {
      await this.updateTasksFromDb();
      await pause(UPDATE_INTERVAL_MS);
      while (this.length > 0) {
        await this.handleNewTask();
        await pause(EXECUTE_INTERVAL_MS);
      }
    }
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
    if (
      bridgeTxn.txnStatus === BridgeTxnStatusEnum.DONE_OUTGOING ||
      bridgeTxn.txnStatus === BridgeTxnStatusEnum.USER_CONFIRMED
    ) {
      await this.finishTask(bridgeTxn);
      return;
    }
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

  private async finishTask(bridgeTxn: BridgeTxn) {
    // TODO: move this task to "finished" table
    await new Promise<void>((resolve) => {
      resolve();
    });
    this.removeTask(bridgeTxn);
  }

  /* private async */ removeTask(bridgeTxn: BridgeTxn) {
    throw new Error(
      `Function not implemented. ${bridgeTxn.uid} is not removed`
    );
  }

  private _hasTask(bridgeTxn: BridgeTxn): boolean {
    return this.queue.includes(bridgeTxn); // TODO: should compare UID here.
  }

  private _pop(): BridgeTxn | undefined {
    return this.queue.pop();
  }
}

const bridgeWorker = new BridgeWorker(db);
