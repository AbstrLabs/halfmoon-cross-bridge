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

import {
  NearTxnOutcome,
  type AlgoTxnId,
  type NearAddr,
  type NearTxnId,
} from '.';
import { BlockchainName } from '..';
import { ENV } from '../utils/dotenv';
import { logger } from '../utils/logger';
import { Blockchain } from '.';
import { literals } from '../utils/literals';
import { BridgeError, ERRORS } from '../utils/errors';
import { atomToYoctoNear, yoctoNearToAtom } from '../utils/formatter';
import { NearTxnParam } from '../utils/type';

type ClientParam = {
  networkId: string;
  nodeUrl: string;
  walletUrl: string;
  helperUrl: string;
  explorerUrl: string;
  headers: Record<never, never>;
};

type IndexerParam = {
  url: string;
};

class NearBlockchain extends Blockchain {
  public readonly centralizedAddr: NearAddr = ENV.NEAR_MASTER_ADDR;
  readonly indexer: providers.JsonRpcProvider;
  protected /* readonly */ centralizedAcc!: Account;
  protected /* readonly */ client!: Near;
  public readonly confirmTxnConfig = {
    timeoutSec: ENV.NEAR_CONFIRM_TIMEOUT_SEC,
    intervalSec: ENV.NEAR_CONFIRM_INTERVAL_SEC,
  };
  private _keyStore: keyStores.KeyStore;
  public readonly name = BlockchainName.NEAR;

  constructor(clientParam: ClientParam, indexerParam: IndexerParam) {
    super();
    this._keyStore = new keyStores.InMemoryKeyStore();
    this.indexer = new providers.JsonRpcProvider(indexerParam);

    // setup client
    connect({ ...clientParam, keyStore: this._keyStore }).then((near) => {
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

  async getTxnStatus(txnParam: NearTxnParam): Promise<NearTxnOutcome> {
    logger.silly('nearIndexer: getTxnStatus()');
    const result = await this.indexer.txStatus(
      txnParam.txnId,
      txnParam.fromAddr
    );
    logger.info(literals.NEAR_TXN_RESULT(result));
    return result;
  }

  verifyCorrectness(
    txnOutcome: NearTxnOutcome,
    nearTxnParam: NearTxnParam
  ): boolean {
    const { fromAddr, toAddr, atomAmount, txnId } = nearTxnParam;
    logger.verbose(literals.NEAR_VERIFY_OUTCOME(txnOutcome));
    if (txnOutcome.status instanceof Object) {
      if (
        txnOutcome.status.Failure !== undefined &&
        txnOutcome.status.Failure !== null
      ) {
        throw new BridgeError(ERRORS.EXTERNAL.MAKE_TXN_FAILED, {
          txnOutcome,
          to: toAddr,
          from: fromAddr,
          amount: atomAmount,
          blockchainName: this.name,
        });
      }
    } else {
      if (
        txnOutcome.status === providers.FinalExecutionStatusBasic.NotStarted ||
        txnOutcome.status === providers.FinalExecutionStatusBasic.Failure
      ) {
        throw new BridgeError(ERRORS.TXN.TXN_NOT_CONFIRMED, {
          blockchainName: this.name,
        });
      }
    }

    const receivedAtom = yoctoNearToAtom(
      txnOutcome.transaction.actions[0].Transfer.deposit
    );

    // check txnId
    if (txnOutcome.transaction_outcome.id !== txnId) {
      throw new BridgeError(ERRORS.TXN.TXN_ID_MISMATCH, {
        expectedId: txnId,
        blockchainId: txnOutcome.transaction_outcome.id,
        blockchainName: this.name,
      });
    }

    // check from address
    if (txnOutcome.transaction.signer_id !== fromAddr) {
      throw new BridgeError(ERRORS.TXN.TXN_SENDER_MISMATCH, {
        blockchainName: this.name,
        receivedSender: fromAddr,
        blockchainSender: txnOutcome.transaction.signer_id,
      });
    } // TODO: later: maybe signer != sender?
    // check to address
    if (txnOutcome.transaction.receiver_id !== toAddr) {
      throw new BridgeError(ERRORS.TXN.TXN_RECEIVER_MISMATCH, {
        blockchainName: this.name,
        receivedReceiver: toAddr,
        blockchainReceiver: txnOutcome.transaction.receiver_id,
      });
    }
    // check amount

    if (receivedAtom !== atomAmount) {
      console.log({
        blockchainName: this.name,
        receivedAmount: atomAmount,
        blockchainAmount: receivedAtom,
      }); // DEV_LOG_TO_REMOVE

      throw new BridgeError(ERRORS.TXN.TXN_AMOUNT_MISMATCH, {
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
    // console.log('response : ', response); // DEV_LOG_TO_REMOVE

    return response.transaction_outcome.id;
  }
  // not used.
  protected static async getRecentTransactions(
    limit: number
  ): Promise<NearTxnId[]> {
    throw new BridgeError(ERRORS.INTERNAL.NOT_IMPLEMENTED, { TxnLimit: limit });
  }
}

let clientParam: ClientParam, indexerParam: IndexerParam;
if (ENV.NEAR_NETWORK === 'testnet') {
  clientParam = {
    networkId: 'testnet',
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org',
    headers: {},
  };
  indexerParam = {
    url: 'https://archival-rpc.testnet.near.org',
  };
} else {
  throw new BridgeError(ERRORS.INTERNAL.NETWORK_NOT_SUPPORTED, {
    blockchainName: BlockchainName.NEAR,
    network: ENV.NEAR_NETWORK,
    currentSupportedNetworks: ['testnet'], // TODO: make this a constant
  });
}

const nearBlockchain = new NearBlockchain(clientParam, indexerParam);
