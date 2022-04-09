import { type TxID, type addr } from '..';
import { BridgeTxnParam } from '../..';

export { Indexer };

abstract class Indexer {
  static confirmTransaction(bridgeTxnParam: BridgeTxnParam): Promise<boolean> {
    throw new Error('not implemented!');
  }
  static getRecentTransactions(limit: number): Promise<TxID[]> {
    throw new Error('not implemented!');
  }
}
