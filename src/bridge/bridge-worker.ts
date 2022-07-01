/**
 * A worker to handle transactions with a queue.
 */
export { type BridgeWorker, bridgeWorker };

import ObjectSet from 'object-set-type';
import { BridgeTxn, BridgeTxnObj } from '.';
import { BridgeTxnStatusEnum, BridgeTxnStatusTree } from '..';
import { db, type Database } from '../database/db';
import { emailServer } from '../server/email';
import { pause } from '../utils/helper';
import { logger } from '../utils/logger';

// TODO: add this to setting (maybe .env)
const EXECUTE_INTERVAL_MS = 1_000;
const UPDATE_INTERVAL_MS = 5_000;

class BridgeWorker {
  queue: ObjectSet<BridgeTxn>;
  database: Database;

  constructor(database = db) {
    this.queue = new ObjectSet();
    this.database = database;
  }

  public async run() {
    await this.loadUnfinishedTasksFromDb();
    // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
    while (true) {
      await this.updateTasksFromDb();
      await pause(UPDATE_INTERVAL_MS);
      while (this.size > 0) {
        await this.handleNewTask();
        await pause(EXECUTE_INTERVAL_MS);
      }
    }
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
    // TODO: prune DB. this should be done with db operation. copy from T to U first then remove intersect(T,U) from U.
    const allDbItems = await this.database.readAllTxn();
    for (const item of allDbItems) {
      const bridgeTxn = BridgeTxn.fromDbItem(item);
      if (BridgeTxnStatusTree[bridgeTxn.txnStatus].actionName === null) {
        continue;
      }
      this._add(bridgeTxn);
    }
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
    const newTask = this._getOne();
    if (newTask === undefined) {
      return;
    }
    await this.handleTask(newTask);
  }

  public async addTask(bridgeTxn: BridgeTxn) {
    // TODO: check if task already exists in DB
    await new Promise<void>((resolve) => {
      resolve();
    });
    this._add(bridgeTxn);
  }

  /* GETTERS & SETTERS */
  get size(): number {
    return this.queue.size;
  }
  get length(): number {
    return this.size;
  }
  get taskNum(): number {
    return this.size;
  }
  get queueLength(): number {
    return this.size;
  }

  toString() {
    return JSON.stringify(this.queue);
  }

  /* PRIVATE METHODS */

  private _add(bridgeTxn: BridgeTxn) {
    // ObjectSet did this check already.
    // if (this._has(bridgeTxn)) {
    //   throw new Error('task already exists in TxnHandler queue');
    // }
    this.queue.add(bridgeTxn);
  }

  private async handleTask(bridgeTxn: BridgeTxn) {
    if (
      bridgeTxn.txnStatus === BridgeTxnStatusEnum.DONE_OUTGOING ||
      bridgeTxn.txnStatus === BridgeTxnStatusEnum.USER_CONFIRMED
    ) {
      await this._finishTask(bridgeTxn);
      return;
    }
    const actionName = BridgeTxnStatusTree[bridgeTxn.txnStatus].actionName;
    if (actionName === 'MANUAL') {
      emailServer.sendErrEmail(bridgeTxn.uid, bridgeTxn.toObject());
      this._delete(bridgeTxn);
      return;
    }
    if (actionName === null) {
      throw new Error(
        `actionName is null for ${bridgeTxn.uid} no action's needed.`
      );
    }
    await bridgeTxn[actionName]();
  }

  private async _finishTask(bridgeTxn: BridgeTxn) {
    // TODO: move this task to "finished" table
    await new Promise<void>((resolve) => {
      resolve();
    });
    this._delete(bridgeTxn);
  }

  private _delete(bridgeTxn: BridgeTxn): boolean {
    return this.queue.delete(bridgeTxn);
  }

  private _has(bridgeTxn: BridgeTxn): boolean {
    return this.queue.has(bridgeTxn); // TODO: should compare UID here.
  }

  private _getOne(): BridgeTxn | undefined {
    const [task] = this.queue;
    return task;
  }
}

const bridgeWorker = new BridgeWorker(db);
