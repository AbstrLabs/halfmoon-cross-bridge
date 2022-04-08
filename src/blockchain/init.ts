/* This file initialize blockchain related things */
import * as nearAPI from 'near-api-js';

export { init_near_acc };

async function init_near_acc() {
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
