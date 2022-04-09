export { AlgorandIndexer, initAlgoAcc, genAlgoAcc };

import * as algosdk from 'algosdk';

import { Indexer } from '.';

class AlgorandIndexer extends Indexer {
  static async getTxnStatus(hash: string): Promise<string> {
    return 'finished';
  }
}

/* Functions below are designed to run once */

async function initAlgoAcc() {}

/* unused, tested */
async function genAlgoAcc() {
  const algoAcc = algosdk.generateAccount();
  console.log('Account Address = ' + algoAcc.addr);
  let account_mnemonic = algosdk.secretKeyToMnemonic(algoAcc.sk);
  console.log('Account Mnemonic = ' + account_mnemonic);
  console.log('Account created. Save off Mnemonic and address');
  console.log('Add funds to account using the TestNet Dispenser: ');
  console.log('https://dispenser.testnet.aws.algodev.network/ ');
  return algoAcc;
}

async function issueGoNearASA() {}
