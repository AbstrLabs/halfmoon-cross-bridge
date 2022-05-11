/* Algorand functionalities wrapped up with our centralized account */
export { algoBlockchain, type AlgorandBlockchain, testAlgo };

import * as algosdk from 'algosdk';

import { AlgoAcc, AlgoAddr, AlgoMnemonic, AlgoTxnId } from '.';
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

class AlgorandBlockchain extends Blockchain {
  public readonly client: AlgodClient;
  public readonly indexer: Indexer;
  public readonly defaultTxnParamsPromise: Promise<SuggestedParams>;
  public readonly name = BlockchainName.ALGO;
  public readonly centralizedAssetId: number = ENV.TEST_NET_GO_NEAR_ASSET_ID;
  public readonly centralizedAddr: AlgoAddr = ENV.ALGO_MASTER_ADDR;
  protected readonly centralizedAcc = algosdk.mnemonicToSecretKey(
    ENV.ALGO_MASTER_PASS
  );
  public readonly confirmTxnConfig = {
    timeoutSec: ENV.ALGO_CONFIRM_TIMEOUT_SEC,
    intervalSec: ENV.ALGO_CONFIRM_INTERVAL_SEC,
    algoRound: ENV.ALGO_CONFIRM_ROUND,
  };
  constructor(clientParam: ClientParam, indexerParam: IndexerParam) {
    super();
    const algodClientParamSource = clientParam;
    const algoIndexerParamSource = indexerParam;

    this.client = new AlgodClient(
      algodClientParamSource.token,
      algodClientParamSource.server,
      algodClientParamSource.port
    );

    this.indexer = new Indexer(
      algoIndexerParamSource.token,
      algoIndexerParamSource.server,
      algoIndexerParamSource.port
    );

    this.defaultTxnParamsPromise = this.client.getTransactionParams().do();
  }

  async getTxnStatus(
    txnParam: AlgoTxnParam
  ): Promise<AlgoAssetTransferTxnOutcome> {
    // will timeout in `confirmTxn` if txn not confirmed
    return (await this.indexer
      .lookupTransactionByID(txnParam.txnId)
      .do()) as AlgoAssetTransferTxnOutcome;

    // the following method only checks new blocks
    // return await algosdk.waitForConfirmation(
    //   this.client,
    //   algoTxnId,
    //   this.confirmTxnConfig.algoRound
    // );
  }

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
      throw new BridgeError(ERRORS.TXN.TXN_NOT_CONFIRMED, {
        currentRound,
        confirmedRound,
        blockchainName: this.name,
      });
    }
    // compare assetId
    if (assetId !== this.centralizedAssetId) {
      throw new BridgeError(ERRORS.TXN.TXN_ASSET_ID_NOT_MATCH, {
        blockchainAssetId: assetId,
        expectedAssetId: this.centralizedAssetId,
        blockchainName: this.name,
      });
    }
    // compare txnID
    if (txnId !== algoTxnParam.txnId) {
      throw new BridgeError(ERRORS.TXN.TXN_ASSET_ID_MISMATCH, {
        blockchainId: txnId,
        receivedId: algoTxnParam.txnId,
        blockchainName: this.name,
      });
    }
    // compare sender
    if (sender !== algoTxnParam.fromAddr) {
      throw new BridgeError(ERRORS.TXN.TXN_SENDER_MISMATCH, {
        blockchainSender: sender,
        receivedSender: algoTxnParam.fromAddr,
        blockchainName: this.name,
      });
    }
    // compare receiver
    if (receiver !== algoTxnParam.toAddr) {
      throw new BridgeError(ERRORS.TXN.TXN_RECEIVER_MISMATCH, {
        blockchainReceiver: receiver,
        receivedReceiver: algoTxnParam.toAddr,
        blockchainName: this.name,
      });
    }
    // compare amount
    if (amount !== algoTxnParam.atomAmount.toString()) {
      // Bigint: The trailing "n" is not part of the string.
      throw new BridgeError(ERRORS.TXN.TXN_AMOUNT_MISMATCH, {
        blockchainAmount: amount,
        receivedAmount: algoTxnParam.atomAmount,
        blockchainName: this.name,
      });
    }
    return true;
  }
  async makeOutgoingTxn(algoTxnParam: AlgoTxnParam): Promise<AlgoTxnId> {
    // abstract class implementation.
    // txnId, fromAddr are never used
    return await this._makeGoNearTxnFromAdmin(algoTxnParam);
  }
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
      ENV.TEST_NET_GO_NEAR_ASSET_ID
    );
  }

  protected async _makeAsaTxn(
    algoTxnParam: AlgoTxnParam,
    senderAccount: AlgoAcc,
    asaId: number
  ): Promise<AlgoTxnId> {
    // modified from https://developer.algorand.org/docs/sdks/javascript/#complete-example
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
          err: err,
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
        algoTxnParam.atomAmount,
        txnId,
        confirmedTxn['confirmed-round']
      )
    );
    return txnId;
  }

  /* Methods below are designed to run once */

  protected async _createGoNearWithAdmin() {
    this._createAsaWithMnemonic(noParamGoNearConfig, ENV.ALGO_MASTER_PASS);
  }
  protected async _genAcc() {
    // tested, used only once
    const algoAcc = algosdk.generateAccount();
    logger.warn('Account Address = ' + algoAcc.addr);
    const account_mnemonic = algosdk.secretKeyToMnemonic(algoAcc.sk);
    logger.warn('Account Mnemonic = ' + account_mnemonic);
    logger.warn('Account created. Save off Mnemonic and address');
    logger.warn('Add funds to account using the TestNet Dispenser: ');
    logger.warn('https://dispenser.testnet.aws.algodev.network/ ');
    return algoAcc;
  }
  protected async _createAsaWithMnemonic(
    // tested, used once
    // modified from https://developer.algorand.org/docs/get-details/asa/
    noParamAsaConfig: NoParamAsaConfig,
    creatorMnemonic: AlgoMnemonic
  ) {
    const asaConfigWithSuggestedParams: AsaConfig = {
      ...noParamAsaConfig,
      suggestedParams: await this.defaultTxnParamsPromise,
    };
    const createTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject(
      asaConfigWithSuggestedParams
    );
    const creatorSk = algosdk.mnemonicToSecretKey(creatorMnemonic).sk;
    const recoveredAccount1 = { sk: creatorSk };
    const rawSignedTxn = createTxn.signTxn(recoveredAccount1.sk);
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

// For jest only, to expose _makeAsaTxn but not class AlgorandBlockchain
class TestAlgo extends AlgorandBlockchain {
  constructor(clientParam: ClientParam, indexerParam: IndexerParam) {
    super(clientParam, indexerParam);
  }
  async emulateFrontendTxn(
    algoTxnParam: AlgoTxnParam,
    senderPassPhrase: string
  ) {
    const sender = algosdk.mnemonicToSecretKey(senderPassPhrase);
    return this._makeAsaTxn(
      {
        toAddr: algoTxnParam.toAddr,
        fromAddr: algoTxnParam.fromAddr,
        atomAmount: parseBigInt(algoTxnParam.atomAmount),
        txnId: literals.UNUSED,
      },
      sender,
      ENV.TEST_NET_GO_NEAR_ASSET_ID
    );
  }
  async sendFromExampleToMaster(atomAmount: bigint): Promise<AlgoTxnId> {
    return this.emulateFrontendTxn(
      {
        toAddr: ENV.ALGO_MASTER_ADDR,
        fromAddr: ENV.ALGO_EXAMPL_ADDR,
        atomAmount: atomAmount,
        txnId: literals.UNUSED,
      },
      ENV.ALGO_EXAMPL_PASS
    );
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

let clientParam: ClientParam, indexerParam: IndexerParam;
if (ENV.ALGO_NETWORK === 'testnet') {
  clientParam = PURE_STAKE_DAEMON_CLIENT_TESTNET;
  indexerParam = PURE_STAKE_INDEXER_CLIENT_TESTNET;
} else {
  throw new BridgeError(ERRORS.INTERNAL.NETWORK_NOT_SUPPORTED, {
    blockchainName: BlockchainName.ALGO,
    network: ENV.ALGO_NETWORK,
    currentSupportedNetworks: ['testnet'], // TODO: make this a constant
  });
}
const algoBlockchain = new AlgorandBlockchain(clientParam, indexerParam);
const testAlgo = new TestAlgo(clientParam, indexerParam);
