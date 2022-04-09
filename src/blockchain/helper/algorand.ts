import { Indexer } from '.';

export { AlgorandIndexer };

class AlgorandIndexer extends Indexer {
  static async getTxnStatus(hash: string): Promise<string> {
    return 'finished';
  }
}
