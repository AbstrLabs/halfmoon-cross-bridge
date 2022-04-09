import { providers, utils } from 'near-api-js';

import { type nearAddr, type nearTxHash } from '../';
import { ENV } from '../../utils/dotenv';
import { log } from '../../utils/logger';
import { Indexer } from './';

export { NearIndexer };

class NearIndexer extends Indexer {
  static provider: providers.JsonRpcProvider = new providers.JsonRpcProvider(
    'https://archival-rpc.testnet.near.org'
  ); // TODO: deprecated

  static async getTxnStatus(
    txId: nearTxHash,
    from: nearAddr
  ): Promise<providers.FinalExecutionOutcome> {
    log('nearIndexer', 'getTxnStatus()'); //verbose
    const result = await NearIndexer.provider.txStatus(txId, from);
    log(result);
    // log((result.receipts_outcome[0] as any).proof!);
    return result;
  }
  static async confirmTransaction(
    from: nearAddr,
    to: nearAddr,
    amount: number,
    txId: nearTxHash
  ): Promise<boolean> {
    log('nearIndexer', 'confirmStatus()', 'txHash'); //verbose

    const confirmed = new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(false);
      }, ENV.NEAR_CONFIRM_TIMEOUT_SEC * 1000);
      setInterval(async () => {
        let txReceipt = await NearIndexer.getTxnStatus(txId, from);
        if (correctnessCheck(txReceipt, to, from, amount)) {
          resolve(true);
        } else {
          resolve(false);
        }
      }, ENV.NEAR_CONFIRM_INTERVAL_SEC * 1000);
    });
    return await confirmed;
  }

  static async getRecentTransactions(limit: number): Promise<nearTxHash[]> {
    log('nearIndexer', 'getRecentTransactions()', 'limit'); //verbose
    throw new Error('Not implemented');
    return [];
  }
}

/* helper */

const correctnessCheck = (
  txReceipt: providers.FinalExecutionOutcome,
  to: nearAddr,
  from: nearAddr,
  amount: number
): boolean => {
  // status check
  if (txReceipt.status instanceof Object) {
    // txReceipt.status = txReceipt.status as providers.FinalExecutionStatus;
    if (
      txReceipt.status.Failure !== undefined ||
      txReceipt.status.Failure !== null
    ) {
      return false;
    }
  } else {
    if (
      txReceipt.status === providers.FinalExecutionStatusBasic.NotStarted ||
      txReceipt.status === providers.FinalExecutionStatusBasic.Failure
    ) {
      return false;
    }
  }
  // from
  if (txReceipt.transaction.signer_id !== from) {
    return false;
  } // maybe signer != sender?
  // to
  if (txReceipt.transaction.receiver_id !== to) {
    return false;
  }
  // amount
  if (
    txReceipt.transaction.actions[0].Transfer.deposit !==
    utils.format.parseNearAmount(`${amount}`)
  ) {
    return false;
  }
  //TODO: amount should be string // 10^24 > 2^53.
  return true;
};
