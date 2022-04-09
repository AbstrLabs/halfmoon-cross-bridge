import { providers, utils } from 'near-api-js';

import { type nearAddr, type nearTxHash } from '../';
import { BridgeTxnParam } from '../..';
import { ENV } from '../../utils/dotenv';
import { setImmediateInterval } from '../../utils/helper';
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
    bridgeTxnParam: BridgeTxnParam
  ): Promise<boolean> {
    log('nearIndexer', 'confirmStatus()', 'txHash'); //verbose
    const { from, to, amount, txId } = bridgeTxnParam;
    const confirmed = new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, ENV.NEAR_CONFIRM_TIMEOUT_SEC * 1000);

      const interval = setImmediateInterval(async () => {
        console.log('itv run : '); // DEV_LOG_TO_REMOVE

        let txReceipt = await NearIndexer.getTxnStatus(txId, from);
        if (correctnessCheck(txReceipt, to, from, amount)) {
          clearTimeout(timeout);
          clearInterval(interval);
          resolve(true);
        } else {
          clearTimeout(timeout);
          clearInterval(interval);
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
  amount: string
): boolean => {
  // status check
  if (txReceipt.status instanceof Object) {
    // txReceipt.status = txReceipt.status as providers.FinalExecutionStatus;
    if (
      txReceipt.status.Failure !== undefined &&
      txReceipt.status.Failure !== null
    ) {
      log('nearIndexer', 'correctnessCheck()', 'txReceipt.status.Failure'); //debug
      return false;
    }
  } else {
    if (
      txReceipt.status === providers.FinalExecutionStatusBasic.NotStarted ||
      txReceipt.status === providers.FinalExecutionStatusBasic.Failure
    ) {
      log('nearIndexer', 'correctnessCheck()', 'txReceipt.status.Failure'); //debug
      return false;
    }
  }
  // from
  if (txReceipt.transaction.signer_id !== from) {
    log('nearIndexer', 'correctnessCheck()', 'txReceipt.transaction.signer_id'); //debug
    return false;
  } // maybe signer != sender?
  // to
  if (txReceipt.transaction.receiver_id !== to) {
    log(
      'nearIndexer',
      'correctnessCheck()',
      'txReceipt.transaction.receiver_id'
    ); //debug
    return false;
  }
  // amount
  if (
    txReceipt.transaction.actions[0].Transfer.deposit !==
    utils.format.parseNearAmount(`${amount}`)
  ) {
    log(
      'nearIndexer',
      'correctnessCheck()',
      'txReceipt.transaction.actions[0].Transfer.deposit'
    ); //debug
    return false;
  }
  //TODO: amount should be string // 10^24 > 2^53.
  return true;
};
