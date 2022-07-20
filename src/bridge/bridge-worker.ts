/**
 * A worker to handle transactions with a queue.
 *
 * @todo pass UID instead of BridgeTxn across this singleton.
 */
export { type BridgeWorker, bridgeWorker, FetchAction, startBridgeTxnWorker };

import lodash from 'lodash';
import { BridgeTxn } from '.';
import { BridgeTxnStatusTree, NodeEnvEnum } from '..';
import { db, type Database } from '../database/db';
import { emailServer } from '../api/email';
import { ENV } from '../utils/dotenv';
import { pause } from '../utils/helper';
import { logger } from '../utils/logger';
import { TxnUid } from '../utils/type/type';
import { BridgeTxnStatusEnum } from '../utils/type/shared-types/txn';

// TODO: add this to setting (maybe .env)
const EXECUTE_INTERVAL_MS = 1_000;
const UPDATE_INTERVAL_MS = 5_000;

// TODO: [SYM] ref: should use on more lik these?
const LOAD = Symbol('LOAD');
const UPDATE = Symbol('UPDATE');
const FetchAction = { LOAD, UPDATE } as const;
type FetchActionType = typeof FetchAction[keyof typeof FetchAction];

class BridgeWorker {
  #queue: Map<TxnUid, BridgeTxn>;
  #lastFetchingTime: Date;
  database: Database;

  constructor(database = db) {
    this.#queue = new Map();
    this.#lastFetchingTime = new Date(0);
    this.database = database;
  }

  public async run() {
    logger.info('[BW ]: Start running.');
    await this.fetchTasksFromDb(LOAD);
    // eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
    while (true) {
      await pause(UPDATE_INTERVAL_MS);
      while (this.size > 0) {
        await this.handleOneTask();
        await pause(EXECUTE_INTERVAL_MS);
      }
      logger.info(`[BW ]: No task left, fetching new tasks.`);
      await this.fetchTasksFromDb(UPDATE);
    }
  }

  /**
   * Fetch tasks from the database. Supports LOAD and UPDATE.
   *
   * @param fetchAction - action of {@link FetchActionType}
   * @returns Promise of void
   */
  async fetchTasksFromDb(fetchAction: FetchActionType): Promise<void> {
    // TODO: merge with updateTasksFromDb
    // TODO: prune DB. this should be done with db operation. copy from T to U first then remove intersect(T,U) from U.
    const allDbItems = await this.database.readAllTxn();
    this.#lastFetchingTime = new Date(Date.now());
    for (const item of allDbItems) {
      const bridgeTxn = BridgeTxn.fromDbItem(item);
      // later this won't be needed since all finished items will be removed from that table.
      if (BridgeTxnStatusTree[bridgeTxn.txnStatus].actionName === null) {
        logger.silly(`[BW ]: Skipping finished task ${bridgeTxn.uid}`);
        // TODO: change this back to debug, and filter in db.
        continue;
      }
      logger.silly(
        // 57 = 52 max len + 1 for '.' + 3 for dbId + 1 for backup
        `Loaded bridgeTxn with uid,txnStatus: ${bridgeTxn.uid.padEnd(57)},${
          bridgeTxn.txnStatus
        }`
      );
      switch (fetchAction) {
        case LOAD:
          this._add(bridgeTxn);
          break;
        case UPDATE:
          this._update(bridgeTxn);
      }
    }
  }

  async handleOneTask() {
    const newTask = this._getRandomOne();
    if (newTask === undefined) {
      logger.info('[BW ]: No task to handle.');
      return;
    }
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
  get value() {
    return this.#queue;
  }
  get lastFetchingTime(): Date {
    return this.#lastFetchingTime;
  }

  // rename
  get length(): number {
    return this.size;
  }
  get taskNum(): number {
    return this.size;
  }
  get queueLength(): number {
    return this.size;
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
    // TODO [BTST]: check if can update
    if (this._has(bridgeTxn)) {
      // TODO: check if txn is newer than current
    }
    this.#queue.set(bridgeTxn.uid, bridgeTxn);
  }

  /**
   * @todo ref: pass UID here.
   * @param bridgeTxn - A BridgeTxn
   * @returns
   */
  private async handleTask(bridgeTxn: BridgeTxn) {
    logger.info(
      `[BW ]: Handling task with uid, status: ${bridgeTxn.uid}, ${bridgeTxn.txnStatus}`
    );
    if (
      bridgeTxn.txnStatus === BridgeTxnStatusEnum.DONE_OUTGOING ||
      bridgeTxn.txnStatus === BridgeTxnStatusEnum.USER_CONFIRMED
    ) {
      logger.verbose(`[BW ]: Moved finished task ${bridgeTxn.uid}.`);
      await this._finishTask(bridgeTxn);
      return;
    } else {
      const actionName = BridgeTxnStatusTree[bridgeTxn.txnStatus].actionName;
      if (actionName === 'MANUAL') {
        logger.verbose(`[BW ]: Sent error mail for ${bridgeTxn.uid}.`);
        emailServer.sendErrEmail(bridgeTxn.uid, bridgeTxn.toSafeObject());
        await this._dropTask(bridgeTxn);
        return;
      } else if (actionName === null) {
        throw new Error(
          `[BW ]: actionName is null for ${bridgeTxn.uid} no action's needed.`
        );
        // TODO: should do something here like remove this task from queue
      } else {
        logger.verbose(
          `[BW ]: Executing ${actionName} on ${bridgeTxn.uid} with status ${bridgeTxn.txnStatus}.`
        );
        try {
          await bridgeTxn[actionName]();
          await this._finishTask(bridgeTxn);
        } catch (e) {
          logger.error(
            `[BW ]: Error executing ${actionName} on ${bridgeTxn.uid}.`
          );
          logger.error(e);
          await this._dropTask(bridgeTxn);
          return;
        }
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
    if (ENV.NODE_ENV !== NodeEnvEnum.TEST) {
      throw new Error(
        '[BW ]: _test_DropAll can only be called in test mode. Current mode:' +
          ENV.NODE_ENV.toString()
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

function startBridgeTxnWorker() {
  bridgeWorker.run().catch((err) => {
    logger.error(err);
  });
}