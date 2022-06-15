/**
 * A worker to handle transactions with a queue.
 */
import { BridgeTxn, BridgeTxnObj } from '.';
import { BridgeTxnStatusTree } from '..';
import { TxnType } from '../blockchain';
import { type Database } from '../database/db';
import { emailServer } from '../server/email';
import { logger } from '../utils/logger';

export { type TxnHandler, txnHandler };

class TxnHandler {
  queue: BridgeTxn[];
  constructor() {
    this.queue = [];
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
  async loadUnfinishedTasksFromDb(db: Database) {
    const mintDbItems = await db.readAllTxn(TxnType.MINT);
    const burnDbItems = await db.readAllTxn(TxnType.BURN);
    for (const mintDbItem of mintDbItems) {
      this.queue.push(BridgeTxn.fromDbItem(mintDbItem, TxnType.MINT));
    }
    for (const burnDbItem of burnDbItems) {
      this.queue.push(BridgeTxn.fromDbItem(burnDbItem, TxnType.BURN));
    }
    // no longer needed: check repeated tasks, test, filter finished / error tasks.
    // TODO: need a func for both arr.
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
      await this.handleTask(bridgeTxn);
    }
  }

  public async run(db: Database) {
    await this.loadUnfinishedTasksFromDb(db);
    await this.handleTasks();
    setInterval(() => {
      throw new Error(`Function not implemented.`);
      // this.updateTasksFromDb(db);
    }, 50_000);
  }

  addTask(bridgeTxn: BridgeTxn) {
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
