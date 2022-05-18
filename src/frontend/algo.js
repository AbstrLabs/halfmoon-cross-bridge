const myAlgoWallet = new MyAlgoConnect();
let algoAccountButton = $('algorand-connect-btn')[0];
let algoAddressContext = $('algo-address')[0];
let algoOptInButton = $('algorand-optin')[0];
let algoTransferButton = $('algorand-transfer')[0];
let algoTxInput = $('burn_txnId')[0];
let algorandAddress;

const connectToMyAlgo = async () => {
  try {
    const accounts = await myAlgoWallet.connect();
    algorandAddress = accounts[0].address;
    algoAccountButton.textContent = algoAccountButton.textContent
    algoAddressContext.textContent = algorandAddress
    algoAccountButton.disabled = true;
    algoOptInButton.style.display = 'block';
    algoTransferButton.disabled = false;
  } catch (err) {
    console.error(err);
  }
}

const algodClient = new algosdk.Algodv2('', 'https://node.testnet.algoexplorerapi.io', '');
const to = 'JMJLRBZQSTS6ZINTD3LLSXCW46K44EI2YZHYKCPBGZP3FLITIQRGPELOBE';

/*Warning: Browser will block pop-up if user doesn't trigger myAlgoWallet.connect() with a button interation */

/* Algorand wallet transfer function */
async function signTransaction(from, to, amountAlgo) {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do();
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({ suggestedParams, from, to, amount: amountAlgo, assetIndex: 83251085 });
    const signedTxn = await myAlgoWallet.signTransaction(txn.toByte());
    const response = await algodClient.sendRawTransaction(signedTxn.blob).do();
    return response
  } catch (err) {
    console.error(err);
  }
}

let algoAmount = document.getElementById('burn_amount');
const algo_unit = 10000000000;
const goNEARTransfer = async (event) => {
  event.preventDefault()
  try {
    const from = algorandAddress; // change
    const amountAlgo = algoAmount.value * 10000000000;
    const response = await signTransaction(from, to, amountAlgo);
    console.log(response)
    algoTxInput.value = response.txId
  } catch (err) {
    console.error(err);
  }
}

const optInGoNear = async () => {
  const from = algorandAddress;
  const amountAlgo = 0;
  const response = await signTransaction(from, from, amountAlgo);
  console.log(response)
}

/* check algo transaction */
const indexerParam = {
  token: { 'X-API-Key': 'WLJDqY55G5560kyCJVp647ERNZ5kJkdZ8OUdGNnV' },
  server: 'https://testnet-algorand.api.purestake.io/idx2',
  port: '', // from https://developer.purestake.io/code-samples
};

const indexer = new algosdk.Indexer(
  indexerParam.token,
  indexerParam.server,
  indexerParam.port
);

let goNearAmount = document.getElementById('burn_amount_filled');
let algoFilledTx = document.getElementById('burn_txnId_filled');
let algoFilledAccount = document.getElementById('burn_from_filled');

const checkAlgoTx = async (event) => {
  event.preventDefault()
  try {
    const result = await indexer.lookupTransactionByID(algoTxInput.value).do()
    console.log(result)
  } catch (err) {
    console.error(err);
  }
}

/* confirm burn */
let burnConfirmPage = document.getElementById('burn-confirm-page');
let burnReceiver = document.getElementById('burn_to');
let burnFilledReceiver = document.getElementById('burn_to_filled');
const confirmBurn = (event) => {
  event.preventDefault()
  burnConfirmPage.style.display = 'block';
  burnFilledReceiver.textContent = burnReceiver.value
  document.getElementById('burn-button').disabled = false
}

/* burn */
const startBurn = async () => {
  //change after api
}
