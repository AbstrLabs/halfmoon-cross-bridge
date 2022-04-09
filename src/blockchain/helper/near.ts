import { Indexer } from '.';
import { nearAddr, type nearTxHash } from '..';
import { log } from '../../utils/logger';
import { providers } from 'near-api-js';

export { NearIndexer };

class NearIndexer extends Indexer {
  static provider: providers.JsonRpcProvider = new providers.JsonRpcProvider(
    'https://archival-rpc.testnet.near.org'
  );

  static async getTxnStatus(
    txHash: nearTxHash,
    senderAddr: nearAddr
  ): Promise<boolean> {
    log('nearIndexer', 'getTxnStatus()', 'txHash'); //verbose
    const result = await NearIndexer.provider.txStatus(txHash, senderAddr);
    log('result', result);
    return true;
  }
  static async confirmTransaction(
    txHash: nearTxHash,
    senderAddr: nearAddr
  ): Promise<boolean> {
    log('nearIndexer', 'confirmStatus()', 'txHash'); //verbose

    const confirmed = new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(false);
      }, +(process.env.NEAR_CONFIRM_TIMEOUT_SEC as string) * 1000);

      setInterval(async () => {
        if (await NearIndexer.getTxnStatus(txHash, senderAddr)) {
          // TODO: check amount
          resolve(true);
        }
      }, +(process.env.NEAR_CONFIRM_INTERVAL_SEC as string) * 1000);
    });

    return await confirmed;
  }
  static async getRecentTransactions(limit: number): Promise<nearTxHash[]> {
    log('nearIndexer', 'getRecentTransactions()', 'limit'); //verbose
    return [];
  }
}
