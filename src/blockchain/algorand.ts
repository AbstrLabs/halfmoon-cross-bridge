export { algoBlockchain, createGoNearWithAdmin };

import * as algosdk from 'algosdk';

import { algoAddr, algoMnemonic, algoTxnId, nearAddr } from '.';

import { Algodv2 as AlgodClient } from 'algosdk';
import { Blockchain } from '.';
import { ENV } from '../utils/dotenv';
import { SuggestedParams } from 'algosdk';
import { log } from '../utils/logger';

interface AsaConfig {
  from: string;
  assetName: string;
  decimals: number; // uint
  total: number | bigint; // uint
  unitName: string;
  assetURL: string;
  suggestedParams: SuggestedParams;
  note?: Uint8Array;
  manager?: nearAddr;
  reserve?: nearAddr;
  freeze?: nearAddr;
  clawback?: nearAddr;
  defaultFrozen: boolean;
  assetId?: number; // uint
}
type NoParamAsaConfig = Omit<AsaConfig, 'suggestedParams'>;

class AlgorandBlockchain extends Blockchain {
  client: AlgodClient;
  constructor() {
    super();
    const pure_stake_client = {
      token: { 'X-API-Key': ENV.PURE_STAKE_API_KEY },
      server: 'https://testnet-algorand.api.purestake.io/ps2',
      port: '', // from https://developer.purestake.io/code-samples
    };
    const algoClientParamSource = pure_stake_client;
    const { token, server, port } = algoClientParamSource;
    this.client = new AlgodClient(token, server, port);
  }
  async getTxnStatus(txnId: algoTxnId): Promise<string> {
    return 'finished';
  }
  async confirmTransaction() {
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
    creatorMnemonic: algoMnemonic
  ) {
    const asaConfigWithSuggestedParams: AsaConfig = {
      ...noParamAsaConfig,
      suggestedParams: await this.client.getTransactionParams().do(),
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

const noParamGoNearConfig: Omit<AsaConfig, 'suggestedParams'> = {
  from: ENV.ALGO_MASTER_ADDR,
  assetName: 'goNEAR',
  decimals: 10, // 1 atomic goNEAR = 10^14 yoctoNEAR
  total: BigInt(10 ** (9 + 10)), // NEAR total supply 1 billion.
  // fixed: JS gives  BigInt(10 ** (9 + 10)) = 10000000000000000000n
  // fixed: JS gives  BigInt(10 ** (9 + 24)) ==> 999999999999999945575230987042816n
  unitName: 'goNEAR',
  assetURL: '',
  note: undefined,
  manager: undefined,
  reserve: undefined,
  freeze: undefined,
  clawback: undefined,
  defaultFrozen: false,
  assetId: undefined,
};

async function createGoNear(creatorMnemonic: algoMnemonic, admin?: algoAddr) {
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
