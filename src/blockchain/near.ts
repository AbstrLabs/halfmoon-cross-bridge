/**
 * NEAR functionalities wrapped up with our centralized account
 *
 * @throws {@link ERRORS.INTERNAL.NETWORK_NOT_SUPPORTED} if network is not supported
 * @todo master acc should be dynamic, or create a new instance per unidirectional bridge.
 * @todo should dynamic select networkInstanceName
 */

export { nearBlockchain, type NearBlockchain };

import {
  type Near,
  type Account,
  connect,
  KeyPair,
  keyStores,
  providers,
} from 'near-api-js';

import { NearTxnOutcome, type AlgoTxnId, type NearAddr } from './abstract-base';
import { BlockchainName } from '..';
import { ENV, NETWORK_INSTANCE } from '../utils/dotenv';
import { logger } from '../utils/logger';
import { Blockchain } from './abstract-base';
import { literals } from '../utils/literals';
import { BridgeError, ERRORS } from '../utils/errors';
import { atomToYoctoNear, yoctoNearToAtom } from '../utils/formatter';
import { NearTxnParam } from '../utils/type/type';

interface ClientParam {
  networkId: string;
  nodeUrl: string;
  walletUrl: string;
  helperUrl: string;
  explorerUrl: string;
  headers: Record<never, never>;
}

interface IndexerParam {
  url: string;
}

interface BridgeConfig {
  centralizedAssetId: number;
  centralizedAddr: NearAddr;
  centralizedPrivateKey: string;
}

// TODO: should dynamic select networkInstanceName
const networkInstanceName =
  ENV.NEAR_NETWORK === NETWORK_INSTANCE.TESTNET ? 'testnet' : 'unsupported';

/**
 * NEAR blockchain wrapper, with centralized account. Implements {@link Blockchain}.
 *
 * @param clientParam - NEAR client parameters
 * @param indexerParam - NEAR indexer parameters
 * @param bridgeConfig - NEAR bridge configuration
 */
class NearBlockchain extends Blockchain {
  public readonly centralizedAddr: NearAddr;
  readonly indexer: providers.JsonRpcProvider;
  protected /* readonly */ centralizedAcc!: Account;
  protected /* readonly */ client!: Near;
  public readonly confirmTxnConfig = {
    timeoutSec: ENV.NEAR_CONFIRM_TIMEOUT_SEC,
    intervalSec: ENV.NEAR_CONFIRM_INTERVAL_SEC,
  };
  #keyStore: keyStores.KeyStore;
  public readonly name = BlockchainName.NEAR;

  constructor(
    clientParam: ClientParam,
    indexerParam: IndexerParam,
    bridgeConfig: BridgeConfig
  ) {
    super();
    this.centralizedAddr = bridgeConfig.centralizedAddr;
    this.#keyStore = new keyStores.InMemoryKeyStore();
    this.indexer = new providers.JsonRpcProvider(indexerParam);

    // setup client
    connect({ ...clientParam, keyStore: this.#keyStore })
      .then((near) => {
        this.client = near;

        // setup centralizedAcc
        const centralizedAccPrivKey = bridgeConfig.centralizedPrivateKey;
        const keyPair = KeyPair.fromString(centralizedAccPrivKey);
        this.#keyStore
          .setKey(networkInstanceName, this.centralizedAddr, keyPair)
          .then(async () => {
            this.centralizedAcc = await this.client.account(
              this.centralizedAddr
            );
          })
          .catch((err: unknown) => {
            throw new BridgeError(ERRORS.EXTERNAL.NEAR_CLIENT_CONNECT_ERROR, {
              err,
              reason: 'cannot get master account from client',
            });
          });
      })
      .catch((err: unknown) => {
        // logger.error(literals.NEAR_CLIENT_CONNECT_ERROR(err));
        throw new BridgeError(ERRORS.EXTERNAL.NEAR_CLIENT_CONNECT_ERROR, {
          err,
          reason: 'cannot connect to near client',
        });
      });
  }

  /**
   * Get the status of a transaction. Implements the abstract method in {@link Blockchain}.
   *
   * @override
   * @param txnParam - NEAR Transaction parameters
   * @returns NEAR Transaction outcome
   */
  async getTxnStatus(txnParam: NearTxnParam): Promise<NearTxnOutcome> {
    logger.silly('nearIndexer: getTxnStatus()');
    const result = await this.indexer.txStatus(
      txnParam.txnId,
      txnParam.fromAddr
    );
    logger.info(
      literals.TXN_CONFIRMED(
        txnParam.fromAddr,
        txnParam.toAddr,
        this.name,
        txnParam.atomAmount,
        txnParam.txnId,
        'round unknown'
      )
    );
    return result;
  }

  /**
   * Verify the correctness of a transaction. Implements the abstract method in {@link Blockchain}.
   *
   * @throws {@link ERRORS.EXTERNAL.MAKE_TXN_FAILED} if the transaction is not valid.
   * @throws {@link ERRORS.API.TXN_NOT_CONFIRMED} if the transaction is not confirmed.
   * @throws {@link ERRORS.API.TXN_ID_MISMATCH} if the transaction id is not correct.
   * @throws {@link ERRORS.API.TXN_SENDER_MISMATCH} if the transaction sender is not correct.
   * @throws {@link ERRORS.API.TXN_RECEIVER_MISMATCH} if the transaction receiver is not correct.
   * @throws {@link API.TXN_AMOUNT_MISMATCH} if the transaction amount is not correct.
   * @override
   * @param txnOutcome - NEAR Transaction outcome
   * @param nearTxnParam - NEAR Transaction parameters
   * @returns boolean
   */
  verifyCorrectness(
    txnOutcome: NearTxnOutcome,
    nearTxnParam: NearTxnParam
  ): boolean {
    const { fromAddr, toAddr, atomAmount, txnId } = nearTxnParam;
    logger.debug(literals.NEAR_VERIFY_OUTCOME(txnOutcome));
    if (txnOutcome.status instanceof Object) {
      if (txnOutcome.status.Failure !== undefined) {
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
        throw new BridgeError(ERRORS.API.TXN_NOT_CONFIRMED, {
          blockchainName: this.name,
        });
      }
    }

    const receivedAtom = yoctoNearToAtom(
      // TODO [TNFT]: Type FinalExecutionOutcome.transaction.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
      txnOutcome.transaction.actions[0].Transfer.deposit
    );

    // check txnId
    if (txnOutcome.transaction_outcome.id !== txnId) {
      throw new BridgeError(ERRORS.API.TXN_ID_MISMATCH, {
        expectedId: txnId,
        blockchainId: txnOutcome.transaction_outcome.id,
        blockchainName: this.name,
      });
    }

    // check from address
    // TODO [TNFT]: Type FinalExecutionOutcome.transaction.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
    if (txnOutcome.transaction.signer_id !== fromAddr) {
      throw new BridgeError(ERRORS.API.TXN_SENDER_MISMATCH, {
        blockchainName: this.name,
        receivedSender: fromAddr,
        // TODO [TNFT]: Type FinalExecutionOutcome.transaction.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment
        blockchainSender: txnOutcome.transaction.signer_id,
      });
    } // TODO: later: maybe signer != sender?

    // check to address
    // TODO [TNFT]: Type FinalExecutionOutcome.transaction.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment
    if (txnOutcome.transaction.receiver_id !== toAddr) {
      throw new BridgeError(ERRORS.API.TXN_RECEIVER_MISMATCH, {
        blockchainName: this.name,
        receivedReceiver: toAddr,
        // TODO [TNFT]: Type FinalExecutionOutcome.transaction.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment
        blockchainReceiver: txnOutcome.transaction.receiver_id,
      });
    }
    // check amount

    if (receivedAtom !== atomAmount) {
      throw new BridgeError(ERRORS.API.TXN_AMOUNT_MISMATCH, {
        blockchainName: this.name,
        receivedAmount: atomAmount,
        blockchainAmount: receivedAtom,
      });
    }
    return true;
  }

  /**
   * Send a transaction of the amount in `NearTxnParam` from centralized account to target in `NearTxnParam`.
   * Implements the abstract method in {@link Blockchain}.
   *
   * @override
   * @param nearTxnParam - NEAR Transaction parameters
   * @returns Promise
   */
  async makeOutgoingTxn(nearTxnParam: NearTxnParam): Promise<AlgoTxnId> {
    const response = await this.centralizedAcc.sendMoney(
      nearTxnParam.toAddr, // receiver account
      atomToYoctoNear(nearTxnParam.atomAmount) // amount in yoctoNEAR
    );

    return response.transaction_outcome.id;
  }

  // /**
  //  * Unused slot for get recent transactions of an account.
  //  *
  //  * @throws {@link ERRORS.INTERNAL.NOT_IMPLEMENTED} if the transaction amount is not correct.
  //  * @param  {address} addr - not implemented yet
  //  * @param  {number} limit
  //  * @returns {Promise<NearTxnId[]>} - list of transaction ids
  //  */
  // protected static async getRecentTransactions(
  //   limit: number
  // ): Promise<NearTxnId[]> {
  //   throw new BridgeError(ERRORS.INTERNAL.NOT_IMPLEMENTED, { TxnLimit: limit });
  // }
}

let clientParam: ClientParam,
  indexerParam: IndexerParam,
  bridgeConfig: BridgeConfig;
if (ENV.NEAR_NETWORK === NETWORK_INSTANCE.TESTNET) {
  clientParam = {
    networkId: networkInstanceName,
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org',
    headers: {},
  };
  // TODO: check if nearAPI also has .provider(s) (indexer)
  indexerParam = {
    url: 'https://archival-rpc.testnet.near.org',
  };
  bridgeConfig = {
    centralizedAssetId: 0, // not used
    centralizedAddr: ENV.NEAR_MASTER_ADDR,
    centralizedPrivateKey: ENV.NEAR_MASTER_PRIV,
  };
} else {
  throw new BridgeError(ERRORS.INTERNAL.NETWORK_NOT_SUPPORTED, {
    blockchainName: BlockchainName.NEAR,
    network: ENV.NEAR_NETWORK,
    currentSupportedNetworks: Object.values(NETWORK_INSTANCE), // TODO: make this a constant
  });
}

const nearBlockchain = new NearBlockchain(
  clientParam,
  indexerParam,
  bridgeConfig
);
