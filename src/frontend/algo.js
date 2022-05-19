const ALGO_UNIT = 10_000_000_000;
const myAlgoWallet = new MyAlgoConnect();
let algorandAddress;
let algoAccountButton = $('#algorand-connect-btn')[0];
let algoAddressContext = $('#algo-address')[0];
let algoOptInButton = $('#algorand-optin')[0];
let algoTransferButton = $('#algorand-transfer')[0];
let algoTxInput = $('#burn_txnId')[0];
let algoAmount = document.getElementById('burn_amount');
let goNearAmount = $('#burn_amount_filled')[0];
let algoFilledTx = $('#burn_txnId_filled')[0];
let algoFilledAccount = $('#burn_from_filled')[0];
let burnConfirmPage = $('#burn-confirm-page')[0];
let burnReceiver = $('#burn_to')[0];
let burnFilledReceiver = $('#burn_to_filled')[0];

const connectToMyAlgo = async () => {
  try {
    const accounts = await myAlgoWallet.connect();
    algorandAddress = accounts[0].address;
    algoAccountButton.textContent = 'My Algo Wallet Connected as (TODO: show wallet alias)';
    algoAddressContext.textContent = algorandAddress
    algoAccountButton.disabled = true;
    algoOptInButton.style.display = 'block';
    algoTransferButton.disabled = false;
  } catch (err) {
    console.error(err);
  }
}

const algodClient = new algosdk.Algodv2('', 'https://node.testnet.algoexplorerapi.io', '');

/*Warning: Browser will block pop-up if user doesn't trigger myAlgoWallet.connect() with a button interation */

/* Algorand wallet transfer function */
async function signGoNearTransaction(from, to, amountAlgo) {
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


const requestSignGoNearTxn = async (amountStr) => {

  const from = algorandAddress; // change
  const to = window.CONSTANT.ALGO_MASTER_ACCOUNT;
  const amount = +amountStr * ALGO_UNIT;
  try {
    const response = await signGoNearTransaction(from, to, amount);
    console.log('response : ', response); // DEV_LOG_TO_REMOVE
    // TODO: Err handling: no goNEAR in acc.
    return response.txId
  } catch (err) {
    console.error(err);
  }
}

const optInGoNear = async (addr) => {
  const response = await signGoNearTransaction(addr, addr, 0);
  console.log(response)
  return response
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




const checkAlgoTx = async (event) => {
  event.preventDefault()
  try {
    const result = await indexer.lookupTransactionByID(algoTxInput.value).do()
    console.log(result)
  } catch (err) {
    console.error(err);
  }
}

const authorizeBurnTransaction = async (amount) => {

  const cbUrl = new URL('/redirect', window.location.href);
  cbUrl.searchParams.set('path', '/api/burn');
  cbUrl.searchParams.set('burn_amount', amount);
  cbUrl.searchParams.set('burn_to', burnReceiver.value);
  cbUrl.searchParams.set('burn_from', algorandAddress);
  console.log('cbUrl : ', cbUrl.toString()); // DEV_LOG_TO_REMOVE

  let txnId = await requestSignGoNearTxn(amount)
  cbUrl.searchParams.set('burn_txnId', txnId);

  const callbackUrl = cbUrl.toString();
  window.location.assign(callbackUrl)
  // burnConfirmPage.style.display = 'block';
  // burnFilledReceiver.textContent = burnReceiver.value
  // document.getElementById('burn-button').disabled = false
}

/* burn */
const startBurn = async () => {
  //change after api
}
