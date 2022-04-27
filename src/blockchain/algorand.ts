/* Algorand functionalities wrapped up with our centralized account */
export { algoBlockchain };

import * as algosdk from 'algosdk';

import {
  AlgoAcc,
  AlgoAddr,
  AlgoMnemonic,
  AlgoReceipt,
  AlgoTxId,
  AlgoAssetTransferTxOutcome,
} from '.';
import {
  Algodv2 as AlgodClient,
  AssetTransferTxn,
  Indexer,
  SuggestedParams,
} from 'algosdk';
import {
  AsaConfig,
  type NoParamAsaConfig,
  noParamGoNearConfig,
} from '../utils/config/asa';

import { Blockchain } from '.';
import { ENV } from '../utils/dotenv';
import { GenericTxInfo } from '..';
import { goNearToAtom } from '../utils/formatter';
import { log } from '../utils/logger';

class AlgorandBlockchain extends Blockchain {
  readonly client: AlgodClient;
  readonly indexer: Indexer;
  readonly defaultTxnParamsPromise: Promise<SuggestedParams>;
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
    genericTxInfo: GenericTxInfo
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
      throw Error(
        `currentRound: ${currentRound} < confirmedRound: ${confirmedRound}`
      );
      return false;
    }
    // compare txID
    if (txId !== genericTxInfo.txId) {
      throw Error(
        `txnOutcome.txID ${txId} !== genericTxInfo.txId ${genericTxInfo.txId}`
      );
      return false;
    }
    // compare sender
    if (sender !== genericTxInfo.from) {
      throw Error(
        `txnOutcome.sender ${sender} !== genericTxInfo.from ${genericTxInfo.from}`
      );
      return false;
    }
    // compare receiver
    if (receiver !== genericTxInfo.to) {
      throw Error(
        `txnOutcome.receiver ${receiver} !== genericTxInfo.to ${genericTxInfo.to}`
      );
      return false;
    }
    // compare amount
    if (`${amount}` !== genericTxInfo.amount) {
      throw Error(
        `txnOutcome.amount ${amount} !== genericTxInfo.amount ${genericTxInfo.amount}`
      );
      return false;
    }
    return true;
  }
  async makeOutgoingTxn(genericTxInfo: GenericTxInfo): Promise<AlgoTxId> {
    // abstract class implementation.
    // TODO! make sure amount is atomic unit!
    return await this._makeGoNearTxnFromAdmin(
      genericTxInfo.to,
      genericTxInfo.amount
    );
  }
  protected async _makeGoNearTxnFromAdmin(to: AlgoAddr, amount: string) {
    return await this._makeAsaTxn(
      to,
      this.centralizedAcc.addr,
      // TODO: BAN-15: amount should be parsed right after API call
      BigInt(goNearToAtom(amount)),
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
    // modified from https://developer.algorand.org/docs/sdks/javascript/#build-first-transaction
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

    let rawSignedTxn = txn.signTxn(senderAccount.sk);
    let xtx = await this.client.sendRawTransaction(rawSignedTxn).do();
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(
      this.client,
      xtx.txId,
      4
    );
    //Get the completed Transaction
    log(
      `Transaction from ${from} to ${to} of amount ${amountInAtomic} (atomic unit) with id ${xtx.txId} confirmed in round ${confirmedTxn['confirmed-round']}`
    );
    return xtx.txId;
  }

  /* Methods below are designed to run once */

  protected async _createGoNearWithAdmin() {
    this.createAsaWithMnemonic(noParamGoNearConfig, ENV.ALGO_MASTER_PASS);
  }
  async genAcc() {
    // tested, not used
    const algoAcc = algosdk.generateAccount();
    console.log('Account Address = ' + algoAcc.addr);
    let account_mnemonic = algosdk.secretKeyToMnemonic(algoAcc.sk);
    console.log('Account Mnemonic = ' + account_mnemonic);
    console.log('Account created. Save off Mnemonic and address');
    console.log('Add funds to account using the TestNet Dispenser: ');
    console.log('https://dispenser.testnet.aws.algodev.network/ ');
    return algoAcc;
  }

  async createAsaWithMnemonic(
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
    log(
      `New ASA ${noParamAsaConfig.assetName} created with ${tx.txId} having id ${noParamAsaConfig.assetId}.`
    );
    return noParamAsaConfig;
  }
}

const algoBlockchain = new AlgorandBlockchain();