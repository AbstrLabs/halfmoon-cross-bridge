/* NEAR functionalities wrapped up with our centralized account */

export { nearBlockchain, type NearBlockchain };

import { providers } from 'near-api-js';

import {
  type AlgoTxnId,
  type NearTxnParam,
  type NearAddr,
  type NearTxnId,
} from '.';
import { BlockchainName } from '..';
import { ENV } from '../utils/dotenv';
import { logger } from '../utils/logger';
import { Blockchain } from '.';
import { literal } from '../utils/literal';
import { BridgeError, ERRORS } from '../utils/errors';
import { yoctoNearToAtom } from '../utils/formatter';

class NearBlockchain extends Blockchain {
  protected readonly centralizedAcc = undefined;
  readonly provider: providers.JsonRpcProvider = new providers.JsonRpcProvider(
    'https://archival-rpc.testnet.near.org'
  ); // TODO: deprecated
  public readonly confirmTxnConfig = {
    timeoutSec: ENV.NEAR_CONFIRM_TIMEOUT_SEC,
    intervalSec: ENV.NEAR_CONFIRM_INTERVAL_SEC,
  };
  name = BlockchainName.NEAR;

  constructor() {
    super();
  }

  async getTxnStatus(
    txnId: NearTxnId,
    from: NearAddr
  ): Promise<providers.FinalExecutionOutcome> {
    // TODO: Type FinalExecutionOutcome.transaction.
    logger.silly('nearIndexer: getTxnStatus()');
    const result = await this.provider.txStatus(txnId, from);
    logger.info(literal.NEAR_TXN_RESULT(result));
    return result;
  }

  verifyCorrectness(
    txnOutcome: providers.FinalExecutionOutcome,
    nearTxnParam: NearTxnParam
  ): boolean {
    const { fromAddr, toAddr, atomAmount, txnId } = nearTxnParam;
    logger.verbose(literal.NEAR_VERIFY_OUTCOME(txnOutcome));
    const txnReceipt = txnOutcome;
    if (txnReceipt.status instanceof Object) {
      // txnReceipt.status = txnReceipt.status as providers.FinalExecutionStatus;
      if (
        txnReceipt.status.Failure !== undefined &&
        txnReceipt.status.Failure !== null
      ) {
        throw new BridgeError(ERRORS.EXTERNAL.MAKE_TXN_FAILED, {
          txnReceipt,
          to: toAddr,
          from: fromAddr,
          amount: atomAmount,
          blockchainName: this.name,
        });
      }
    } else {
      if (
        txnReceipt.status === providers.FinalExecutionStatusBasic.NotStarted ||
        txnReceipt.status === providers.FinalExecutionStatusBasic.Failure
      ) {
        throw new BridgeError(ERRORS.TXN.TX_NOT_CONFIRMED, {
          blockchainName: this.name,
        });
      }
    }
    // TODO: more var declaration here
    const receivedAtom = yoctoNearToAtom(
      txnReceipt.transaction.actions[0].Transfer.deposit
    );

    // check from address
    if (txnReceipt.transaction.signer_id !== fromAddr) {
      throw new BridgeError(ERRORS.TXN.TX_SENDER_MISMATCH, {
        blockchainName: this.name,
        receivedSender: fromAddr,
        blockchainSender: txnReceipt.transaction.signer_id,
      });
    } // TODO: later: maybe signer != sender?
    // check to address
    if (txnReceipt.transaction.receiver_id !== toAddr) {
      throw new BridgeError(ERRORS.TXN.TX_RECEIVER_MISMATCH, {
        blockchainName: this.name,
        receivedReceiver: toAddr,
        blockchainReceiver: txnReceipt.transaction.receiver_id,
      });
    }
    // check amount

    if (receivedAtom !== atomAmount) {
      console.log({
        blockchainName: this.name,
        receivedAmount: atomAmount,
        blockchainAmount: receivedAtom,
      }); // DEV_LOG_TO_REMOVE

      throw new BridgeError(ERRORS.TXN.TX_AMOUNT_MISMATCH, {
        blockchainName: this.name,
        receivedAmount: atomAmount,
        blockchainAmount: receivedAtom,
      });
    }
    return true;
  }
  async makeOutgoingTxn(nearTxnParam: NearTxnParam): Promise<AlgoTxnId> {
    throw new BridgeError(ERRORS.INTERNAL.NOT_IMPLEMENTED);
  }
  // not used.
  protected static async getRecentTransactions(
    limit: number
  ): Promise<NearTxnId[]> {
    logger.silly('nearIndexer getRecentTransactions() limit');
    throw new BridgeError(ERRORS.INTERNAL.NOT_IMPLEMENTED);
  }
}

const nearBlockchain = new NearBlockchain();
