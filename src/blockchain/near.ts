/* NEAR functionalities wrapped up with our centralized account */

export { nearBlockchain, type NearBlockchain };

import {
  type Near,
  type Account,
  connect,
  KeyPair,
  keyStores,
  providers,
} from 'near-api-js';

import { type AlgoTxnId, type NearAddr, type NearTxnId } from '.';
import { BlockchainName } from '..';
import { ENV } from '../utils/dotenv';
import { logger } from '../utils/logger';
import { Blockchain } from '.';
import { literals } from '../utils/literals';
import { BridgeError, ERRORS } from '../utils/errors';
import { atomToYoctoNear, yoctoNearToAtom } from '../utils/formatter';
import { NearTxnParam } from '../utils/type';

class NearBlockchain extends Blockchain {
  public readonly centralizedAddr: NearAddr = ENV.NEAR_MASTER_ADDR;
  readonly provider: providers.JsonRpcProvider = new providers.JsonRpcProvider({
    url: 'https://archival-rpc.testnet.near.org',
  }); // TODO: ren to indexer, also in abstract class
  protected /* readonly */ centralizedAcc!: Account; // TODO: async-constructor: add the readonly property
  protected /* readonly */ client!: Near; // TODO: async-constructor: add the readonly property
  public readonly confirmTxnConfig = {
    timeoutSec: ENV.NEAR_CONFIRM_TIMEOUT_SEC,
    intervalSec: ENV.NEAR_CONFIRM_INTERVAL_SEC,
  };
  private _keyStore: keyStores.KeyStore;
  public readonly name = BlockchainName.NEAR;

  constructor() {
    super();
    this._keyStore = new keyStores.InMemoryKeyStore();

    // setup client
    const config = {
      networkId: 'testnet',
      keyStore: this._keyStore,
      nodeUrl: 'https://rpc.testnet.near.org',
      walletUrl: 'https://wallet.testnet.near.org',
      helperUrl: 'https://helper.testnet.near.org',
      explorerUrl: 'https://explorer.testnet.near.org',
      headers: {},
    };
    connect(config).then((near) => {
      this.client = near;

      // setup centralizedAcc
      const centralizedAccPrivKey = ENV.NEAR_MASTER_PRIV;
      const keyPair = KeyPair.fromString(centralizedAccPrivKey);
      this._keyStore
        .setKey('testnet', this.centralizedAddr, keyPair)
        .then(async () => {
          this.centralizedAcc = await this.client.account(this.centralizedAddr);
        });
    });
  }

  async getTxnStatus(
    txnId: NearTxnId,
    from: NearAddr
  ): Promise<providers.FinalExecutionOutcome> {
    // TODO: Type FinalExecutionOutcome.transaction.
    logger.silly('nearIndexer: getTxnStatus()');
    const result = await this.provider.txStatus(txnId, from);
    logger.info(literals.NEAR_TXN_RESULT(result));
    return result;
  }

  verifyCorrectness(
    txnOutcome: providers.FinalExecutionOutcome,
    nearTxnParam: NearTxnParam
  ): boolean {
    const { fromAddr, toAddr, atomAmount, txnId } = nearTxnParam;
    logger.verbose(literals.NEAR_VERIFY_OUTCOME(txnOutcome));
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

    const receivedAtom = yoctoNearToAtom(
      txnReceipt.transaction.actions[0].Transfer.deposit
    );

    // check txnId
    if (txnReceipt.transaction_outcome.id !== txnId) {
      throw new BridgeError(ERRORS.TXN.TX_ID_MISMATCH, {
        expectedId: txnId,
        blockchainId: txnReceipt.transaction_outcome.id,
        blockchainName: this.name,
      });
    }

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
    const response = await this.centralizedAcc.sendMoney(
      nearTxnParam.toAddr, // receiver account
      atomToYoctoNear(nearTxnParam.atomAmount) // amount in yoctoNEAR
    );
    console.log('response : ', response); // DEV_LOG_TO_REMOVE

    return response.transaction_outcome.id;
  }
  // not used.
  protected static async getRecentTransactions(
    limit: number
  ): Promise<NearTxnId[]> {
    throw new BridgeError(ERRORS.INTERNAL.NOT_IMPLEMENTED, { TxnLimit: limit });
  }
}

const nearBlockchain = new NearBlockchain();
