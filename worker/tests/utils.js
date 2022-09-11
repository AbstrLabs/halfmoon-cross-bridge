const {
  keyStores,
  KeyPair,
  connect,
  utils,
  transactions,
} = require('near-api-js');
const { env } = require('../dist/utils');
const algosdk = require('algosdk');
const { Algodv2, Indexer, waitForConfirmation } = require('algosdk');
const AlgodClient = Algodv2;
const Decimal = require('decimal.js');

async function depositOnNearTestnet(
  fromPrivKey,
  fromAddr,
  custodyAddr,
  amountInNEAR,
  toAlgoAddr
) {
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
  let amount = utils.format.parseNearAmount(amountInNEAR); // amount in yoctoNEAR

  const result = await account.signAndSendTransaction({
    receiverId: custodyAddr,
    actions: [
      transactions.functionCall(
        'add_bridge_request',
        Buffer.from(
          JSON.stringify({
            to_blockchain: 'Algorand',
            to_token: 'goNEAR',
            to_address: toAlgoAddr,
          })
        ),
        '300000000000000',
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
    amountInNEAR,
    env('ALGO_EXAMPL_ADDR')
  );
}

async function depositOnAlgoTestnet(
  fromPass,
  fromAddr,
  custodyAddr,
  amountInGoNEAR,
  toNEARAddr
) {
  let sk = algosdk.mnemonicToSecretKey(fromPass).sk;

  let client = new AlgodClient(
    {
      'X-API-KEY': env('PURE_STAKE_API_KEY'),
    },
    env('PURE_STAKE_ALGOD_URL'),
    ''
  );
  const params = await client.getTransactionParams().do();

  const enc = new TextEncoder();
  const note = enc.encode(toNEARAddr);
  const amount = Decimal(amountInGoNEAR).mul(10_000_000_000).toString();
  const txnConfig = {
    to: custodyAddr,
    from: fromAddr,
    amount: BigInt(amount),
    note,
    suggestedParams: params,
    assetIndex: 83251085, // goNEAR
    revocationTarget: undefined,
    closeRemainderTo: undefined,
  };

  const txn =
    algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(txnConfig);

  const txId = txn.txID().toString();
  // Sign the transaction
  const rawSignedTxn = txn.signTxn(sk);
  await client.sendRawTransaction(rawSignedTxn).do();
  await waitForConfirmation(client, txId, 50);
  let indexer = new Indexer(
    {
      'X-API-KEY': env('PURE_STAKE_API_KEY'),
    },
    env('PURE_STAKE_INDEXER_URL'),
    ''
  );
  return await indexer.lookupTransactionByID(txId).do();
}

async function depositOnAlgoTestnetFromExampleToMaster(amountInGoNEAR) {
  return await depositOnAlgoTestnet(
    env('ALGO_EXAMPL_PASS'),
    env('ALGO_EXAMPL_ADDR'),
    env('ALGO_MASTER_ADDR'),
    amountInGoNEAR,
    env('NEAR_EXAMPL_ADDR')
  );
}

module.exports = {
  depositOnNearTestnet,
  depositOnNearTestnetFromExampleToMaster,
  depositOnAlgoTestnet,
  depositOnAlgoTestnetFromExampleToMaster,
};
