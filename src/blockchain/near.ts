/* NEAR functionalities wrapped up with our centralized account */

export { nearBlockchain, NearBlockchain };

import { providers, utils } from 'near-api-js';

import { AlgoTxId, type NearAddr, type NearTxId } from '.';
import { GenericTxInfo } from '..';
import { ENV } from '../utils/dotenv';
import { logger } from '../utils/logger';
import { Blockchain } from '.';
import { literal } from '../utils/literal';

class NearBlockchain extends Blockchain {
  protected readonly centralizedAcc = undefined;
  readonly provider: providers.JsonRpcProvider = new providers.JsonRpcProvider(
    'https://archival-rpc.testnet.near.org'
  ); // TODO: deprecated
  public readonly confirmTxnConfig = {
    timeoutSec: ENV.NEAR_CONFIRM_TIMEOUT_SEC,
    intervalSec: ENV.NEAR_CONFIRM_INTERVAL_SEC,
  };

  constructor() {
    super();
  }

  async getTxnStatus(
    txId: NearTxId,
    from: NearAddr
  ): Promise<providers.FinalExecutionOutcome> {
    logger.silly('nearIndexer: getTxnStatus()');
    const result = await this.provider.txStatus(txId, from);
    logger.info(literal.NEAR_TXN_RESULT(result));
    return result;
  }

  verifyCorrectness(
    txnOutcome: providers.FinalExecutionOutcome,
    genericTxInfo: GenericTxInfo
  ): boolean {
    const { from, to, amount, txId } = genericTxInfo;
    logger.verbose(literal.NEAR_VERIFY_OUTCOME(txnOutcome));

    return correctnessCheck(txnOutcome, to, from, amount);
  }
  async makeOutgoingTxn(genericTxInfo: GenericTxInfo): Promise<AlgoTxId> {
    throw new Error('not implemented!');
  }

  // TODO: protect, not used.
  static async getRecentTransactions(limit: number): Promise<NearTxId[]> {
    logger.silly('nearIndexer getRecentTransactions() limit');
    throw new Error('Not implemented');
    return [];
  }
}

const nearBlockchain = new NearBlockchain();

/* helper */

const correctnessCheck = (
  txReceipt: providers.FinalExecutionOutcome,
  // txID: TxID,
  to: NearAddr,
  from: NearAddr,
  amount: string
): boolean => {
  // status check
  if (txReceipt.status instanceof Object) {
    // txReceipt.status = txReceipt.status as providers.FinalExecutionStatus;
    if (
      txReceipt.status.Failure !== undefined &&
      txReceipt.status.Failure !== null
    ) {
      throw new Error(
        'nearIndexer: correctnessCheck(): txReceipt.status.Failure'
      );
      return false;
    }
  } else {
    if (
      txReceipt.status === providers.FinalExecutionStatusBasic.NotStarted ||
      txReceipt.status === providers.FinalExecutionStatusBasic.Failure
    ) {
      throw new Error(
        'nearIndexer: correctnessCheck(): txReceipt.status.Failure'
      ); //debug
      return false;
    }
  }
  // check from address
  if (txReceipt.transaction.signer_id !== from) {
    throw new Error(
      'nearIndexer: correctnessCheck(): txReceipt.transaction.signer_id'
    );
    return false;
  } // TODO: later: maybe signer != sender?
  // check to address
  if (txReceipt.transaction.receiver_id !== to) {
    throw new Error(
      'nearIndexer: correctnessCheck(): txReceipt.transaction.receiver_id'
    );
    return false;
  }
  // check amount
  if (
    txReceipt.transaction.actions[0].Transfer.deposit !==
    utils.format.parseNearAmount(amount)
  ) {
    throw new Error(
      'nearIndexer: correctnessCheck(): txReceipt.transaction.actions[0].Transfer.deposit'
    );
    return false;
  }
  return true;
};

/* Functions below are designed to run once */

/* not used, not tested */
/* async function initNearAcc() {
  // key store
  const { keyStores, KeyPair } = nearAPI;
  const keyStore = new keyStores.InMemoryKeyStore();
  // const PRIVATE_KEY =
  //   'by8kdJoJHu7uUkKfoaLd2J2Dp1q1TigeWMG123pHdu9UREqPcshCM223kWadm';
  // // creates a public / private key pair using the provided private key
  // const keyPair = KeyPair.fromString(PRIVATE_KEY);
  // // adds the keyPair you created to keyStore
  // await keyStore.setKey('testnet', 'example-account.testnet', keyPair);

  // connect
  const { connect } = nearAPI;
  const config = {
    networkId: 'testnet',
    keyStore,
    headers: {
      // 'Access-Control-Allow-Origin': '*',
      // 'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      // 'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token',
      // 'Content-Type': 'application/json',
    },
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org',
  };
  const near = await connect(config);

  // wallet
  // const { WalletConnection } = nearAPI;
  // const wallet = new WalletConnection(near);
} */
