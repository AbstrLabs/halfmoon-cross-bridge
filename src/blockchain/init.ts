/* This file initialize blockchain related things */

import * as algosdk from 'algosdk';
import * as nearAPI from 'near-api-js';
export { initNearAcc, initAlgoAcc, genAlgoAcc };

/* unused, not tested */
async function initNearAcc() {
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
}

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
