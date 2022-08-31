const {keyStores, KeyPair, connect, utils} = require('near-api-js')
const {env} = require('../dist/utils')

async function transferOnNearTestnet(fromPrivKey, fromAddr, toAddr, amountInNEAR) {
    const keyStore = new keyStores.InMemoryKeyStore();
    const keyPair = KeyPair.fromString(fromPrivKey);
    await keyStore.setKey('testnet', fromAddr, keyPair);
  
    const config = {
      networkId: 'testnet',
      keyStore,
      nodeUrl: env('NEAR_RPC_URL'),
      headers: {},
    };
  
    const near = await connect(config);
    const account = await near.account(fromAddr);
    const response = await account.sendMoney(
      toAddr, // receiver account
      utils.format.parseNearAmount(amountInNEAR) // amount in yoctoNEAR
    );
  
    return response;
  }

  async function transferOnNearTestnetFromExampleToMaster(amountInNEAR) {
    return transferOnNearTestnet(
      env('NEAR_EXAMPL_PRIV'),
      env('NEAR_EXAMPL_ADDR'),
      env('NEAR_MASTER_ADDR'),
      amountInNEAR
    );
  }

  module.exports = {transferOnNearTestnet, transferOnNearTestnetFromExampleToMaster}