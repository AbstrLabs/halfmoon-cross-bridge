/* Algorand functionalities wrapped up with our centralized account */
export { algoBlockchain, type AlgorandBlockchain };

import * as algosdk from 'algosdk';

import {
  AlgoAcc,
  AlgoAddr,
  AlgoMnemonic,
  AlgoTxId,
  AlgoAssetTransferTxOutcome,
} from '.';
import { Algodv2 as AlgodClient, Indexer, SuggestedParams } from 'algosdk';
import {
  AsaConfig,
  type NoParamAsaConfig,
  noParamGoNearConfig,
} from '../utils/config/asa';

import { Blockchain } from '.';
import { ENV } from '../utils/dotenv';
import { BlockchainName, type AlgoTxParam } from '..';
import { logger } from '../utils/logger';
import { literal } from '../utils/literal';
import { BridgeError, ERRORS } from '../utils/errors';

class AlgorandBlockchain extends Blockchain {
  readonly client: AlgodClient;
  readonly indexer: Indexer;
  readonly defaultTxnParamsPromise: Promise<SuggestedParams>;
  readonly name = BlockchainName.ALGO;
  protected readonly centralizedAcc = algosdk.mnemonicToSecretKey(
    ENV.ALGO_MASTER_PASS
  );
  public readonly confirmTxnConfig = {
    timeoutSec: ENV.ALGO_CONFIRM_TIMEOUT_SEC,
    intervalSec: ENV.ALGO_CONFIRM_INTERVAL_SEC,
    algoRound: ENV.ALGO_CONFIRM_ROUND,
  };
  constructor() {
    super();
    const PURE_STAKE_CLIENT = {
      token: { 'X-API-Key': ENV.PURE_STAKE_API_KEY },
      port: '', // from https://developer.purestake.io/code-samples
    };
    const PURE_STAKE_DAEMON_CLIENT = {
      ...PURE_STAKE_CLIENT,
      server: 'https://testnet-algorand.api.purestake.io/ps2',
    };
    const PURE_STAKE_INDEXER_CLIENT = {
      ...PURE_STAKE_CLIENT,
      server: 'https://testnet-algorand.api.purestake.io/idx2',
    };
    // TODO: switch network
    const algodClientParamSource = PURE_STAKE_DAEMON_CLIENT;
    const algoIndexerParamSource = PURE_STAKE_INDEXER_CLIENT;

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

  async getTxnStatus(algoTxId: AlgoTxId): Promise<AlgoAssetTransferTxOutcome> {
    // will timeout in `confirmTxn` if txn not confirmed
    return (await this.indexer
      .lookupTransactionByID(algoTxId)
      .do()) as AlgoAssetTransferTxOutcome;

    // the following method only checks new blocks
    // return await algosdk.waitForConfirmation(
    //   this.client,
    //   algoTxId,
    //   this.confirmTxnConfig.algoRound
    // );
  }

  verifyCorrectness(
    txnOutcome: AlgoAssetTransferTxOutcome,
    algoTxParam: AlgoTxParam
  ): boolean {
    // parse txnOutcome, parse AlgoAssetTransferTxOutcome
    // TODO! verify asset id
    const currentRound = txnOutcome['current-round'];
    const txn = txnOutcome.transaction;
    const confirmedRound = txn['confirmed-round'];
    const amount = `${txn['asset-transfer-transaction'].amount}`;
    const sender = txn.sender;
    const receiver = txn['asset-transfer-transaction'].receiver;
    const txId = txn.id;
    // verify confirmed
    if (!(currentRound >= confirmedRound)) {
      throw new BridgeError(ERRORS.TXN.TX_NOT_CONFIRMED, {
        currentRound,
        confirmedRound,
        blockchainName: this.name,
      });
    }
    // compare txID
    if (txId !== algoTxParam.txId) {
      throw new BridgeError(ERRORS.TXN.TX_ASSET_ID_MISMATCH, {
        blockchainId: txId,
        receivedId: algoTxParam.txId,
        blockchainName: this.name,
      });
    }
    // compare sender
    if (sender !== algoTxParam.fromAddr) {
      throw new BridgeError(ERRORS.TXN.TX_SENDER_MISMATCH, {
        blockchainSender: sender,
        receivedSender: algoTxParam.fromAddr,
        blockchainName: this.name,
      });
    }
    // compare receiver
    if (receiver !== algoTxParam.toAddr) {
      throw new BridgeError(ERRORS.TXN.TX_RECEIVER_MISMATCH, {
        blockchainReceiver: receiver,
        receivedReceiver: algoTxParam.toAddr,
        blockchainName: this.name,
      });
    }
    // compare amount
    if (amount !== algoTxParam.atom.toString()) {
      // The trailing "n" is not part of the string.
      throw new BridgeError(ERRORS.TXN.TX_AMOUNT_MISMATCH, {
        blockchainAmount: amount,
        receivedAmount: algoTxParam.atom,
        blockchainName: this.name,
      });
    }
    return true;
  }
  async makeOutgoingTxn(algoTxParam: AlgoTxParam): Promise<AlgoTxId> {
    // abstract class implementation.
    return await this._makeGoNearTxnFromAdmin(
      algoTxParam.toAddr,
      algoTxParam.atom
    );
  }
  protected async _makeGoNearTxnFromAdmin(to: AlgoAddr, atom: bigint) {
    return await this._makeAsaTxn(
      to,
      this.centralizedAcc.addr,
      atom,
      this.centralizedAcc,
      ENV.TEST_NET_GO_NEAR_ASSET_ID
    );
  }
  // TODO: makeAsaTxn needs an err handler.
  protected async _makeAsaTxn(
    to: AlgoAddr,
    from: AlgoAddr,
    amountInAtomic: number | bigint,
    senderAccount: AlgoAcc,
    asaId: number
  ): Promise<AlgoTxId> {
    // modified from https://developer.algorand.org/docs/sdks/javascript/#complete-example
    let params = await this.defaultTxnParamsPromise;
    // comment out the next two lines to use suggested fee
    // params.fee = algosdk.ALGORAND_MIN_TX_FEE;
    // params.flatFee = true;
    // const enc = new TextEncoder();
    // const note = enc.encode('Hello World');
    const txnConfig = {
      to,
      from,
      amount: amountInAtomic,
      note: undefined, // maybe write the incoming txId here
      suggestedParams: params,
      assetIndex: asaId,
      revocationTarget: undefined,
      closeRemainderTo: undefined,
    };

    let txn =
      algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(txnConfig);

    // Sign the transaction
    let txId = txn.txID().toString();
    let rawSignedTxn = txn.signTxn(senderAccount.sk);
    let rcpt = await this.client.sendRawTransaction(rawSignedTxn).do();
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(
      this.client,
      txId,
      4
    );

    if (rcpt.txId !== txId) {
      throw new BridgeError(ERRORS.EXTERNAL.MAKE_TXN_FAILED, {
        blockchainName: this.name,
        rawTxId: txId,
        blockchainTxId: rcpt.txId,
      });
    }

    //Get the completed Transaction
    logger.info(
      literal.TXN_CONFIRMED(
        from,
        to,
        amountInAtomic,
        confirmedTxn.txId,
        confirmedTxn['confirmed-round']
      )
    );
    return txId;
  }

  /* Methods below are designed to run once */

  protected async _createGoNearWithAdmin() {
    this._createAsaWithMnemonic(noParamGoNearConfig, ENV.ALGO_MASTER_PASS);
  }
  protected async _genAcc() {
    // tested, not used
    const algoAcc = algosdk.generateAccount();
    logger.warn('Account Address = ' + algoAcc.addr);
    let account_mnemonic = algosdk.secretKeyToMnemonic(algoAcc.sk);
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
    let createTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject(
      asaConfigWithSuggestedParams
    );
    const creatorSk = algosdk.mnemonicToSecretKey(creatorMnemonic).sk;
    let recoveredAccount1 = { sk: creatorSk };
    let rawSignedTxn = createTxn.signTxn(recoveredAccount1.sk);
    let tx = await this.client.sendRawTransaction(rawSignedTxn).do();
    const ptx = await algosdk.waitForConfirmation(this.client, tx.txId, 4);
    noParamAsaConfig.assetId = ptx['asset-index'];
    logger.info(
      literal.ASA_CREATED(
        noParamAsaConfig.assetName,
        tx.txId,
        noParamAsaConfig.assetId
      )
    );
    return noParamAsaConfig;
  }
}

const algoBlockchain = new AlgorandBlockchain();
