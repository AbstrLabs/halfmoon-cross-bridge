/**
 * Algorand functionalities wrapped up with our centralized account
 */

export { algoBlockchain, type AlgorandBlockchain, testAlgo };

import * as algosdk from 'algosdk';

import { AlgoAcc, AlgoAddr, AlgoTxnId } from '.';
import { Algodv2 as AlgodClient, Indexer, SuggestedParams } from 'algosdk';
import {
  AsaConfig,
  type NoParamAsaConfig,
  noParamGoNearConfig,
} from '../utils/config/asa';

import { Blockchain } from '.';
import { ENV } from '../utils/dotenv';
import { BlockchainName } from '..';
import { logger } from '../utils/logger';
import { literals } from '../utils/literals';
import { BridgeError, ERRORS } from '../utils/errors';
import {
  AlgoAssetTransferTxnOutcome,
  AlgoTxnParam,
  parseBigInt,
} from '../utils/type';

type ClientParam = {
  token: { 'X-API-Key': string };
  port: string;
  server: string;
};

type IndexerParam = {
  token: { 'X-API-Key': string };
  port: string;
  server: string;
};

type BridgeConfig = {
  centralizedAssetId: number;
  centralizedAddr: AlgoAddr;
  centralizedAccPassPhrase: string;
};

/**
 * @classdesc Algorand blockchain wrapper, with centralized account. Implements {@link Blockchain}.
 *
 * @param  {ClientParam} clientParam
 * @param  {IndexerParam} indexerParam
 * @param  {BridgeConfig} bridgeConfig
 */
class AlgorandBlockchain extends Blockchain {
  public readonly client: AlgodClient;
  public readonly indexer: Indexer;
  public readonly defaultTxnParamsPromise: Promise<SuggestedParams>;
  public readonly name = BlockchainName.ALGO;
  public readonly centralizedAssetId: number;
  public readonly centralizedAddr: AlgoAddr;
  protected readonly centralizedAcc: algosdk.Account;
  public readonly confirmTxnConfig = {
    timeoutSec: ENV.ALGO_CONFIRM_TIMEOUT_SEC,
    intervalSec: ENV.ALGO_CONFIRM_INTERVAL_SEC,
    algoRound: ENV.ALGO_CONFIRM_ROUND,
  };
  constructor(
    clientParam: ClientParam,
    indexerParam: IndexerParam,
    bridgeConfig: BridgeConfig
  ) {
    super();
    this.centralizedAssetId = bridgeConfig.centralizedAssetId;
    this.centralizedAddr = bridgeConfig.centralizedAddr;
    this.centralizedAcc = algosdk.mnemonicToSecretKey(
      bridgeConfig.centralizedAccPassPhrase
    );

    this.client = new AlgodClient(
      clientParam.token,
      clientParam.server,
      clientParam.port
    );

    this.indexer = new Indexer(
      indexerParam.token,
      indexerParam.server,
      indexerParam.port
    );

    this.defaultTxnParamsPromise = this.client.getTransactionParams().do();
  }

  /**
   * Get the status of a transaction. Implements the abstract method in {@link Blockchain}.
   *
   * @async
   * @inheritdoc {@link Blockchain}
   * @param  {AlgoTxnParam} txnParam - transaction parameters on algorand blockchain
   * @returns {Promise<AlgoAssetTransferTxnOutcome>} transaction outcome
   */
  async getTxnStatus(
    txnParam: AlgoTxnParam
  ): Promise<AlgoAssetTransferTxnOutcome> {
    // will timeout in `confirmTxn` if txn not confirmed
    const outcome = (await this.indexer
      .lookupTransactionByID(txnParam.txnId)
      .do()) as AlgoAssetTransferTxnOutcome;

    logger.verbose(
      literals.TXN_CONFIRMED(
        txnParam.fromAddr,
        txnParam.toAddr,
        this.name,
        txnParam.atomAmount,
        txnParam.txnId,
        'round unknown'
      )
    );

    return outcome;

    // the following method only checks new blocks
    // return await algosdk.waitForConfirmation(
    //   this.client,
    //   algoTxnId,
    //   this.confirmTxnConfig.algoRound
    // );
  }

  /**
   * Verify the correctness of a transaction. Implements the abstract method in {@link Blockchain}.
   *
   * @inheritdoc {@link Blockchain}
   * @param  {AlgoAssetTransferTxnOutcome} txnOutcome
   * @param  {AlgoTxnParam} algoTxnParam
   * @returns boolean
   */
  verifyCorrectness(
    txnOutcome: AlgoAssetTransferTxnOutcome,
    algoTxnParam: AlgoTxnParam
  ): boolean {
    // parse txnOutcome, parse AlgoAssetTransferTxnOutcome
    const currentRound = txnOutcome['current-round'];
    const txn = txnOutcome.transaction;
    const confirmedRound = txn['confirmed-round'];
    const amount = `${txn['asset-transfer-transaction'].amount}`;
    const sender = txn.sender;
    const receiver = txn['asset-transfer-transaction'].receiver;
    const txnId = txn.id;
    const assetId = txn['asset-transfer-transaction']['asset-id'];
    // verify confirmed
    if (!(currentRound >= confirmedRound)) {
      throw new BridgeError(ERRORS.API.TXN_NOT_CONFIRMED, {
        currentRound,
        confirmedRound,
        blockchainName: this.name,
      });
    }
    // compare assetId
    if (assetId !== this.centralizedAssetId) {
      throw new BridgeError(ERRORS.API.TXN_ASSET_ID_NOT_MATCH, {
        blockchainAssetId: assetId,
        expectedAssetId: this.centralizedAssetId,
        blockchainName: this.name,
      });
    }
    // compare txnID
    if (txnId !== algoTxnParam.txnId) {
      throw new BridgeError(ERRORS.API.TXN_ASSET_ID_MISMATCH, {
        blockchainId: txnId,
        receivedId: algoTxnParam.txnId,
        blockchainName: this.name,
      });
    }
    // compare sender
    if (sender !== algoTxnParam.fromAddr) {
      throw new BridgeError(ERRORS.API.TXN_SENDER_MISMATCH, {
        blockchainSender: sender,
        receivedSender: algoTxnParam.fromAddr,
        blockchainName: this.name,
      });
    }
    // compare receiver
    if (receiver !== algoTxnParam.toAddr) {
      throw new BridgeError(ERRORS.API.TXN_RECEIVER_MISMATCH, {
        blockchainReceiver: receiver,
        receivedReceiver: algoTxnParam.toAddr,
        blockchainName: this.name,
      });
    }
    // compare amount
    if (amount !== algoTxnParam.atomAmount.toString()) {
      // Bigint: The trailing "n" is not part of the string.
      throw new BridgeError(ERRORS.API.TXN_AMOUNT_MISMATCH, {
        blockchainAmount: amount,
        receivedAmount: algoTxnParam.atomAmount,
        blockchainName: this.name,
      });
    }
    return true;
  }

  /**
   * Send a transaction of the amount in `AlgoTxnParam` from centralized account to target in `AlgoTxnParam`.
   * Implements the abstract method in {@link Blockchain}.
   *
   * @async
   * @inheritdoc {@link Blockchain}
   * @param  {AlgoTxnParam} algoTxnParam - transaction parameters on algorand blockchain
   * @returns {Promise<AlgoTxnId>} promise of algorand transaction id
   */
  async makeOutgoingTxn(algoTxnParam: AlgoTxnParam): Promise<AlgoTxnId> {
    // abstract class implementation.
    // txnId, fromAddr are never used
    return await this._makeGoNearTxnFromAdmin(algoTxnParam);
  }

  /**
   * Send a transaction of goNEAR from admin to the target address.
   *
   * @async
   * @param  {AlgoTxnParam} algoTxnParam - transaction parameters on algorand blockchain
   * @returns {Promise<AlgoTxnId>} promise of algorand transaction id
   */
  protected async _makeGoNearTxnFromAdmin(
    algoTxnParam: AlgoTxnParam
    // txnId, fromAddr are never used
  ): Promise<AlgoTxnId> {
    return await this._makeAsaTxn(
      {
        toAddr: algoTxnParam.toAddr,
        fromAddr: this.centralizedAcc.addr,
        atomAmount: algoTxnParam.atomAmount,
        txnId: literals.UNUSED,
      },
      this.centralizedAcc,
      this.centralizedAssetId
    );
  }

  /**
   * Send a transaction of ASA. Using example from algorand documentation (modified).
   * @tutorial https://developer.algorand.org/docs/sdks/javascript/#complete-example
   *
   * @async
   * @param  {AlgoTxnParam} algoTxnParam
   * @param  {AlgoAcc} senderAccount
   * @param  {number} asaId
   * @returns {Promise<AlgoTxnId>} promise of algorand transaction id
   */
  protected async _makeAsaTxn(
    algoTxnParam: AlgoTxnParam,
    senderAccount: AlgoAcc,
    asaId: number
  ): Promise<AlgoTxnId> {
    const params = await this.defaultTxnParamsPromise;
    // comment out the next two lines to use suggested fee
    // params.fee = algosdk.ALGORAND_MIN_TXN_FEE;
    // params.flatFee = true;
    // const enc = new TextEncoder();
    // const note = enc.encode('Hello World');
    const txnConfig = {
      to: algoTxnParam.toAddr,
      from: algoTxnParam.fromAddr,
      amount: parseBigInt(algoTxnParam.atomAmount),
      note: undefined, // maybe write the incoming txnId here
      suggestedParams: params,
      assetIndex: asaId,
      revocationTarget: undefined,
      closeRemainderTo: undefined,
    };

    const txn =
      algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(txnConfig);

    // Sign the transaction
    const txnId = txn.txID().toString();
    const rawSignedTxn = txn.signTxn(senderAccount.sk);

    const rcpt = await this.client
      .sendRawTransaction(rawSignedTxn)
      .do()
      .catch((err) => {
        throw new BridgeError(ERRORS.EXTERNAL.MAKE_OUTGOING_TXN_FAILED, {
          blockchainName: this.name,
          err,
        });
      });
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(
      this.client,
      txnId,
      4
    );

    if (rcpt.txId !== txnId) {
      throw new BridgeError(ERRORS.EXTERNAL.MAKE_TXN_FAILED, {
        blockchainName: this.name,
        rawTxnId: txnId,
        blockchainTxnId: rcpt.txId,
      });
    }

    //Get the completed Transaction
    logger.verbose(
      literals.TXN_CONFIRMED(
        algoTxnParam.fromAddr,
        algoTxnParam.toAddr,
        this.name,
        algoTxnParam.atomAmount,
        txnId,
        confirmedTxn['confirmed-round']
      )
    );
    return txnId;
  }

  /* Methods below are designed to run once */

  /**
   *  Create a new asset on algorand.
   *
   * @async
   * @returns {Promise<void>} promise of void
   */
  protected async _createGoNearWithAdmin(): Promise<void> {
    this._createAsaWithAccount(noParamGoNearConfig, this.centralizedAcc);
  }

  /**
   * Create a new account on algorand.
   *
   * @async
   * @returns {Promise<AlgoAcc>} promise of {@link AlgoAcc} account created
   */
  protected async _genAcc(): Promise<AlgoAcc> {
    // tested, used only once
    const algoAcc: AlgoAcc = algosdk.generateAccount();
    logger.warn('Account Address = ' + algoAcc.addr);
    const account_mnemonic = algosdk.secretKeyToMnemonic(algoAcc.sk);
    logger.warn('Account Mnemonic = ' + account_mnemonic);
    logger.warn('Account created. Save off Mnemonic and address');
    logger.warn('Add funds to account using the TestNet Dispenser: ');
    logger.warn('https://dispenser.testnet.aws.algodev.network/ ');
    return algoAcc;
  }

  /**
   * Create a new asset on algorand with the given account.
   *
   * @async
   * @param  {NoParamAsaConfig} noParamAsaConfig
   * @param  {AlgoAcc} creatorAccount
   * @returns {Promise<NoParamAsaConfig>} the asa config created
   */
  protected async _createAsaWithAccount(
    // tested, used once
    // modified from https://developer.algorand.org/docs/get-details/asa/
    noParamAsaConfig: NoParamAsaConfig,
    creatorAccount: AlgoAcc
  ): Promise<NoParamAsaConfig> {
    const asaConfigWithSuggestedParams: AsaConfig = {
      ...noParamAsaConfig,
      suggestedParams: await this.defaultTxnParamsPromise,
    };
    const createdTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject(
      asaConfigWithSuggestedParams
    );

    const rawSignedTxn = createdTxn.signTxn(creatorAccount.sk);
    const tx = await this.client.sendRawTransaction(rawSignedTxn).do();
    const ptx = await algosdk.waitForConfirmation(this.client, tx.txId, 4);
    noParamAsaConfig.assetId = ptx['asset-index'];
    logger.info(
      literals.ASA_CREATED(
        noParamAsaConfig.assetName,
        tx.txId,
        noParamAsaConfig.assetId! // eslint-disable-line @typescript-eslint/no-non-null-assertion
      )
    );
    return noParamAsaConfig;
  }
}

const PURE_STAKE_CLIENT = {
  token: { 'X-API-Key': ENV.PURE_STAKE_API_KEY },
  port: '', // from https://developer.purestake.io/code-samples
};
const PURE_STAKE_DAEMON_CLIENT_TESTNET = {
  ...PURE_STAKE_CLIENT,
  server: 'https://testnet-algorand.api.purestake.io/ps2',
};
const PURE_STAKE_INDEXER_CLIENT_TESTNET = {
  ...PURE_STAKE_CLIENT,
  server: 'https://testnet-algorand.api.purestake.io/idx2',
};

let clientParam: ClientParam,
  indexerParam: IndexerParam,
  bridgeConfig: BridgeConfig;

if (ENV.ALGO_NETWORK === 'testnet') {
  clientParam = PURE_STAKE_DAEMON_CLIENT_TESTNET;
  indexerParam = PURE_STAKE_INDEXER_CLIENT_TESTNET;
  bridgeConfig = {
    centralizedAssetId: ENV.TEST_NET_GO_NEAR_ASSET_ID,
    centralizedAddr: ENV.ALGO_MASTER_ADDR,
    centralizedAccPassPhrase: ENV.ALGO_MASTER_PASS,
  };
} else {
  throw new BridgeError(ERRORS.INTERNAL.NETWORK_NOT_SUPPORTED, {
    blockchainName: BlockchainName.ALGO,
    network: ENV.ALGO_NETWORK,
    currentSupportedNetworks: ['testnet'], // TODO: make this a constant
  });
}

const algoBlockchain = new AlgorandBlockchain(
  clientParam,
  indexerParam,
  bridgeConfig
);

/**
 * @classdesc AlgorandBlockchain subclass only for jest, to expose _makeAsaTxn
 *
 * @param  {ClientParam} clientParam
 * @param  {IndexerParam} indexerParam
 * @param  {BridgeConfig} bridgeConfig
 *
 * @todo move to test helper
 */
class TestAlgo extends AlgorandBlockchain {
  constructor(
    clientParam: ClientParam,
    indexerParam: IndexerParam,
    bridgeConfig: BridgeConfig
  ) {
    super(clientParam, indexerParam, bridgeConfig);
  }
  async simulateFrontendTxn(
    algoTxnParam: AlgoTxnParam,
    senderPassPhrase: string
  ): Promise<AlgoTxnId> {
    const sender = algosdk.mnemonicToSecretKey(senderPassPhrase);
    return this._makeAsaTxn(
      {
        toAddr: algoTxnParam.toAddr,
        fromAddr: algoTxnParam.fromAddr,
        atomAmount: parseBigInt(algoTxnParam.atomAmount),
        txnId: literals.UNUSED,
      },
      sender,
      this.centralizedAssetId
    );
  }
  async sendFromExampleToMaster(atomAmount: bigint): Promise<AlgoTxnId> {
    return this.simulateFrontendTxn(
      {
        toAddr: ENV.ALGO_MASTER_ADDR,
        fromAddr: ENV.ALGO_EXAMPL_ADDR,
        atomAmount,
        txnId: literals.UNUSED,
      },
      ENV.ALGO_EXAMPL_PASS
    );
  }
}
const testAlgo = new TestAlgo(clientParam, indexerParam, bridgeConfig);
