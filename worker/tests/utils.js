const {keyStores, KeyPair, connect, utils, transactions} = require('near-api-js')
const {env} = require('../dist/utils')

async function depositOnNearTestnet(fromPrivKey, fromAddr, toAddr, amountInNEAR) {
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
    let amount = utils.format.parseNearAmount(amountInNEAR) // amount in yoctoNEAR

    const result = await account.signAndSendTransaction({
      receiverId: toAddr,
      actions: [
          transactions.functionCall(
              "add_bridge_request",
              Buffer.from(JSON.stringify({
                to_blockchain: "Algorand",
                to_token: "goNEAR",
                to_address: "83251085",
              })),
              "300000000000000",
              amount
          ),
      ],
  });
  
    return result;
  }

  async function depositOnNearTestnetFromExampleToMaster(amountInNEAR) {
    return depositOnNearTestnet(
      env('NEAR_EXAMPL_PRIV'),
      env('NEAR_EXAMPL_ADDR'),
      env('NEAR_MASTER_ADDR'),
      amountInNEAR
    );
  }

  module.exports = {depositOnNearTestnet, depositOnNearTestnetFromExampleToMaster}