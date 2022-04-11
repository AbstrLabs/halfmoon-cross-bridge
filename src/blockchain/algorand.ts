/* Algorand functionalities wrapped up with our centralized account */
export { algoBlockchain, createGoNearWithAdmin };

import * as algosdk from 'algosdk';

import { AlgoAddr, AlgoMnemonic, AlgoTxnId } from '.';
import { Algodv2 as AlgodClient, SuggestedParams } from 'algosdk';
import {
  AsaConfig,
  NoParamAsaConfig,
  noParamGoNearConfig,
} from '../utils/config/asa';

import { Blockchain } from '.';
import { ENV } from '../utils/dotenv';
import { GenericTxInfo } from '..';
import { log } from '../utils/logger';

class AlgorandBlockchain implements Blockchain {
  readonly client: AlgodClient;
  readonly defaultTxnParamsPromise: Promise<SuggestedParams>;
  constructor() {
    const pure_stake_client = {
      token: { 'X-API-Key': ENV.PURE_STAKE_API_KEY },
      server: 'https://testnet-algorand.api.purestake.io/ps2',
      port: '', // from https://developer.purestake.io/code-samples
    };
    const algoClientParamSource = pure_stake_client;
    const { token, server, port } = algoClientParamSource;
    this.client = new AlgodClient(token, server, port);
    this.defaultTxnParamsPromise = this.client.getTransactionParams().do();
  }

  async getTxnStatus(txnId: AlgoTxnId): Promise<string> {
    return 'finished';
  }
  async confirmTransaction(genericTxInfo: GenericTxInfo): Promise<boolean> {
    throw new Error('not implemented!');
  }
  async makeTransaction(genericTxInfo: GenericTxInfo): Promise<AlgoTxnId> {
    throw new Error('not implemented!');
  }

  /* Methods below are designed to run once */

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

/* Functions below are designed to run once */

async function createGoNear(creatorMnemonic: AlgoMnemonic, admin?: AlgoAddr) {
  return await algoBlockchain.createAsaWithMnemonic(
    {
      ...noParamGoNearConfig,
      manager: admin,
      reserve: admin,
      freeze: admin,
      clawback: admin,
    },
    creatorMnemonic
  );
}

async function createGoNearWithAdmin() {
  await createGoNear(ENV.ALGO_MASTER_PASS, ENV.ALGO_MASTER_ADDR); // create algorand account
}

const fake_makeTransaction = async (genericTxInfo: GenericTxInfo) => {
  throw new Error('not implemented!');
};
