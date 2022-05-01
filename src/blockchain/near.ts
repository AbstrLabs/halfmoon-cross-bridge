/* NEAR functionalities wrapped up with our centralized account */

export { nearBlockchain, type NearBlockchain };

import { providers } from 'near-api-js';

import { AlgoTxId, type NearAddr, type NearTxId } from '.';
import { BlockchainName, NearTxParam } from '..';
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
    txId: NearTxId,
    from: NearAddr
  ): Promise<providers.FinalExecutionOutcome> {
    // TODO: Type FinalExecutionOutcome.transaction.
    logger.silly('nearIndexer: getTxnStatus()');
    const result = await this.provider.txStatus(txId, from);
    logger.info(literal.NEAR_TXN_RESULT(result));
    return result;
  }

  verifyCorrectness(
    txnOutcome: providers.FinalExecutionOutcome,
    nearTxParam: NearTxParam
  ): boolean {
    const { fromAddr, toAddr, atom, txId } = nearTxParam;
    logger.verbose(literal.NEAR_VERIFY_OUTCOME(txnOutcome));
    const txReceipt = txnOutcome;
    if (txReceipt.status instanceof Object) {
      // txReceipt.status = txReceipt.status as providers.FinalExecutionStatus;
      if (
        txReceipt.status.Failure !== undefined &&
        txReceipt.status.Failure !== null
      ) {
        throw new BridgeError(ERRORS.EXTERNAL.MAKE_TXN_FAILED, {
          txReceipt: txReceipt,
          to: toAddr,
          from: fromAddr,
          amount: atom,
          blockchainName: this.name,
        });
      }
    } else {
      if (
        txReceipt.status === providers.FinalExecutionStatusBasic.NotStarted ||
        txReceipt.status === providers.FinalExecutionStatusBasic.Failure
      ) {
        throw new BridgeError(ERRORS.TXN.TX_NOT_CONFIRMED, {
          blockchainName: this.name,
        });
      }
    }
    // TODO: more var declaration here
    const receivedAtom = yoctoNearToAtom(
      txReceipt.transaction.actions[0].Transfer.deposit
    );

    // check from address
    if (txReceipt.transaction.signer_id !== fromAddr) {
      throw new BridgeError(ERRORS.TXN.TX_SENDER_MISMATCH, {
        blockchainName: this.name,
        receivedSender: fromAddr,
        blockchainSender: txReceipt.transaction.signer_id,
      });
    } // TODO: later: maybe signer != sender?
    // check to address
    if (txReceipt.transaction.receiver_id !== toAddr) {
      throw new BridgeError(ERRORS.TXN.TX_RECEIVER_MISMATCH, {
        blockchainName: this.name,
        receivedReceiver: toAddr,
        blockchainReceiver: txReceipt.transaction.receiver_id,
      });
    }
    // check amount

    if (receivedAtom !== atom) {
      console.log({
        blockchainName: this.name,
        receivedAmount: atom,
        blockchainAmount: receivedAtom,
      }); // DEV_LOG_TO_REMOVE

      throw new BridgeError(ERRORS.TXN.TX_AMOUNT_MISMATCH, {
        blockchainName: this.name,
        receivedAmount: atom,
        blockchainAmount: receivedAtom,
      });
    }
    return true;
  }
  async makeOutgoingTxn(nearTxParam: NearTxParam): Promise<AlgoTxId> {
    throw new BridgeError(ERRORS.INTERNAL.NOT_IMPLEMENTED);
  }
  // not used.
  protected static async getRecentTransactions(
    limit: number
  ): Promise<NearTxId[]> {
    logger.silly('nearIndexer getRecentTransactions() limit');
    throw new BridgeError(ERRORS.INTERNAL.NOT_IMPLEMENTED);
  }
}

const nearBlockchain = new NearBlockchain();
