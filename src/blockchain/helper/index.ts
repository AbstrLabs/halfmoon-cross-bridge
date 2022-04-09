import { TxID, nearAddr } from '..';

export { Indexer };

abstract class Indexer {
  static confirmTransaction(
    txId: TxID,
    senderAddr: nearAddr
  ): Promise<boolean> {
    throw new Error('not implemented!');
  }
  static getRecentTransactions(limit: number): Promise<TxID[]> {
    throw new Error('not implemented!');
  }
}
