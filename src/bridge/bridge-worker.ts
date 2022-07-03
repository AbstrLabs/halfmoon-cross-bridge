/**
 * A worker to handle transactions with a queue.
 */
export { type BridgeWorker, bridgeWorker };

import lodash from 'lodash';
import { BridgeTxn, BridgeTxnObj } from '.';
import { BridgeTxnStatusEnum, BridgeTxnStatusTree } from '..';
import { db, type Database } from '../database/db';
import { emailServer } from '../server/email';
import { ENV } from '../utils/dotenv';
import { pause } from '../utils/helper';
import { logger } from '../utils/logger';
import { TxnUid } from '../utils/type';

// TODO: add this to setting (maybe .env)
const EXECUTE_INTERVAL_MS = 1_000;
const UPDATE_INTERVAL_MS = 5_000;

class BridgeWorker {
  #queue: Map<TxnUid, BridgeTxn>;
  database: Database;

  constructor(database = db) {
    this.#queue = new Map();
    this.database = database;
  }

  public async run() {
    await this.loadUnfinishedTasksFromDb();
    // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
    while (true) {
      await this.updateTasksFromDb();
      await pause(UPDATE_INTERVAL_MS);
      while (this.size > 0) {
        await this.handleOneTask();
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
    // TODO: merge with updateTasksFromDb
    // TODO: prune DB. this should be done with db operation. copy from T to U first then remove intersect(T,U) from U.
    const allDbItems = await this.database.readAllTxn();
    for (const item of allDbItems) {
      const bridgeTxn = BridgeTxn.fromDbItem(item);
      // later this won't be needed since all finished items will be removed from that table.
      if (BridgeTxnStatusTree[bridgeTxn.txnStatus].actionName === null) {
        continue;
      }
      logger.silly(
        // 57 = 52 max len + 1 for '.' + 3 for dbId + 1 for backup
        `Loaded bridgeTxn with uid,txnStatus: ${bridgeTxn.uid.padEnd(57)},${
          bridgeTxn.txnStatus
        }`
      );

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
    // TODO: prune DB. this should be done with db operation. copy from T to U first then remove intersect(T,U) from U.
    const allDbItems = await this.database.readAllTxn();
    for (const item of allDbItems) {
      const bridgeTxn = BridgeTxn.fromDbItem(item);
      // later this won't be needed since all finished items will be removed from that table.
      if (BridgeTxnStatusTree[bridgeTxn.txnStatus].actionName === null) {
        continue;
      }
      logger.silly(
        // 57 = 52 max len + 1 for '.' + 3 for dbId + 1 for backup
        `Loaded bridgeTxn with uid,txnStatus: ${bridgeTxn.uid.padEnd(57)},${
          bridgeTxn.txnStatus
        }`
      );

      this._update(bridgeTxn);
    }
  }

  async handleOneTask() {
    const newTask = this._getRandomOne();
    if (newTask === undefined) {
      logger.info('[BW ]: No task to handle.');
      return;
    }
    console.log('h1t : '); // DEV_LOG_TO_REMOVE

    await this.handleTask(newTask);
    return newTask.uid;
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
    return this.#queue.size;
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
  get value() {
    return this.#queue;
  }
  valueOf() {
    return this.value;
  }
  toString() {
    return JSON.stringify(this.#queue);
  }

  /* PRIVATE METHODS */

  private _add(bridgeTxn: BridgeTxn) {
    // ObjectSet did this check already.
    if (this._has(bridgeTxn)) {
      throw new Error('[BW ]: _add failed. Task existed, use _update');
    }
    this.#queue.set(bridgeTxn.uid, bridgeTxn);
  }

  private _update(bridgeTxn: BridgeTxn) {
    // get current with bridgeTxn.uid
    // if txn.txnStatus > current, (need partial order on txnStatus)
    // then update current to txn
    if (this._has(bridgeTxn)) {
      // TODO: check if txn is newer than current
    }
    this.#queue.set(bridgeTxn.uid, bridgeTxn);
  }

  private async handleTask(bridgeTxn: BridgeTxn) {
    logger.info(
      `[BW ]: Handling task with uid, status: ${bridgeTxn.uid}, ${bridgeTxn.txnStatus}`
    );
    if (
      bridgeTxn.txnStatus === BridgeTxnStatusEnum.DONE_OUTGOING ||
      bridgeTxn.txnStatus === BridgeTxnStatusEnum.USER_CONFIRMED
    ) {
      console.log('ht1 : '); // DEV_LOG_TO_REMOVE
      logger.verbose(`[BW ]: Moved finished task ${bridgeTxn.uid}.`);
      await this._finishTask(bridgeTxn);
      return;
    } else {
      console.log('ht2 : '); // DEV_LOG_TO_REMOVE
      const actionName = BridgeTxnStatusTree[bridgeTxn.txnStatus].actionName;
      if (actionName === 'MANUAL') {
        console.log('ht21 : '); // DEV_LOG_TO_REMOVE
        logger.verbose(`[BW ]: Sent error mail for ${bridgeTxn.uid}.`);
        emailServer.sendErrEmail(bridgeTxn.uid, bridgeTxn.toSafeObject());
        await this._dropTask(bridgeTxn);
        return;
      } else if (actionName === null) {
        console.log('ht22 : '); // DEV_LOG_TO_REMOVE
        throw new Error(
          `[BW ]: actionName is null for ${bridgeTxn.uid} no action's needed.`
        );
        // TODO: should do something here like remove this task from queue
      } else {
        logger.verbose(
          `[BW ]: Executing ${actionName} on ${bridgeTxn.uid} with status ${bridgeTxn.txnStatus}.`
        );
        await bridgeTxn[actionName]();
      }
      return;
    }
  }

  private async _dropTask(bridgeTxn: BridgeTxn) {
    // TODO: move this task to "error" table
    await new Promise<void>((resolve) => {
      resolve();
    });
    logger.warn('[BW ]: FAKE! (not) moved manual task to error table.');
    this._delete(bridgeTxn);
  }

  private async _finishTask(bridgeTxn: BridgeTxn) {
    // TODO: move this task to "finished" table
    await new Promise<void>((resolve) => {
      resolve();
    });
    logger.warn('[BW ]: FAKE! (not) moved finished task to finished table.');
    this._delete(bridgeTxn);
  }

  private _delete(bridgeTxn: BridgeTxn): boolean {
    return this.#queue.delete(bridgeTxn.uid);
  }

  private _has(bridgeTxn: BridgeTxn): boolean {
    // consider same UID implies same task
    return this.#queue.has(bridgeTxn.uid); // TODO: should compare UID here.
  }
  private _getRandomOne(): BridgeTxn | undefined {
    const [uidTxnPair] = this.#queue;
    return uidTxnPair[1];
  }
  private _checkIfTestEnv() {
    if (ENV.TS_NODE_DEV !== 'test') {
      throw new Error(
        '[BW ]: _test_DropAll can only be called in test mode.' +
          ENV.TS_NODE_DEV.toString()
      );
    }
    return true;
  }

  /* TEST METHODS */
  public _test_dropAll() {
    this._checkIfTestEnv();
    this.#queue.clear();
  }
  get _test_copy() {
    this._checkIfTestEnv();
    return lodash.cloneDeep(this.#queue);
  }
}

const bridgeWorker = new BridgeWorker(db);
