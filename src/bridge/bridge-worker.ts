// TODO: add test

import { BridgeTxnStatusTree } from '..';
import { Database, db } from '../database/db';
import { logger } from '../utils/logger';
// import { TxnUid } from '../utils/type';
import { BridgeTxn } from './bridge-txn';

export { type BridgeWorker, bridgeWorker };

class BridgeWorker {
  queue: BridgeTxn[]; // sync with DB.
  threadNumber: number;
  database: Database;

  constructor(threadNumber = 1, database = db) {
    // JS is single-threaded.
    // + Thread here means how many task in the heap will be executed
    // at the same time. Using 1 for now.
    this.threadNumber = threadNumber;
    this.database = database;
    this.queue = [];
  }

  async loadUnfinishedTasksFromDb() {
    const allDbItems = await this.database.readAllTxn();
    const allBridgeTxns = allDbItems.map((item) => BridgeTxn.fromDbItem(item));
    const unfinishedBridgeTxns = allBridgeTxns.filter(
      (txn) => BridgeTxnStatusTree[txn.txnStatus].actionName !== null
    );
    unfinishedBridgeTxns.map((txn) => this._push(txn));
  }
  private _push(txn: BridgeTxn) {
    logger.info(txn);
    throw new Error('Method not implemented.');
  }

  toString() {
    return JSON.stringify(this.queue);
  }
}

const bridgeWorker = new BridgeWorker();
