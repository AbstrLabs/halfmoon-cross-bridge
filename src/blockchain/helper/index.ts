import { type TxID, type addr } from '..';

export { Indexer };

abstract class Indexer {
  static confirmTransaction(
    from: addr,
    to: addr,
    amount: number,
    txId: TxID
  ): Promise<boolean> {
    throw new Error('not implemented!');
  }
  static getRecentTransactions(limit: number): Promise<TxID[]> {
    throw new Error('not implemented!');
  }
}
