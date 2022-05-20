const ALGO_UNIT = 10_000_000_000;
const GO_NEAR_ASA_ID = 83251085;
const myAlgoWallet = new MyAlgoConnect({
  shouldSelectOneAccount: true,
  openManager: true,
});
let ALGORAND_ADDRESS;
let algoAccountButton = $('#algorand-connect-btn')[0];
let algoAddressContext = $('#algo-address')[0];
let algoOptInButton = $('#algorand-optin')[0];
let algoTransferButton = $('#algorand-transfer')[0];
let algoTxInput = $('#burn_txnId')[0];
let burnReceiver = $('#burn_to')[0];

const connectToMyAlgo = async () => {
  try {
    const accounts = await myAlgoWallet.connect();
    ALGORAND_ADDRESS = accounts[0].address;
    algoAccountButton.textContent = 'My Algo Wallet Connected as (TODO: show wallet alias)';
    algoAddressContext.textContent = ALGORAND_ADDRESS
    algoAccountButton.disabled = true;
    algoOptInButton.style.display = 'block';
    algoTransferButton.disabled = false;
  } catch (err) {
    console.error(err);
  }
}

// const algodClient = new algosdk.Algodv2('', 'https://node.testnet.algoexplorerapi.io', '');
const algodClient = new algosdk.Algodv2({ 'X-API-Key': 'WLJDqY55G5560kyCJVp647ERNZ5kJkdZ8OUdGNnV' }, 'https://testnet-algorand.api.purestake.io/ps2', '');

/*Warning: Browser will block pop-up if user doesn't trigger myAlgoWallet.connect() with a button interation */

/* Algorand wallet transfer function */
async function signGoNearTransaction(from, to, amountAlgo) {
  await myAlgoWallet.connect()
  try {
    const suggestedParams = await algodClient.getTransactionParams().do();
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({ suggestedParams, from, to, amount: amountAlgo, assetIndex: GO_NEAR_ASA_ID });
    const signedTxn = await myAlgoWallet.signTransaction(txn.toByte());
    const response = await algodClient.sendRawTransaction(signedTxn.blob).do();
    return response
  } catch (err) {
    console.error(err);
  }
}


const requestSignGoNearTxn = async (amountStr) => {
  const from = ALGORAND_ADDRESS;
  const to = window.CONSTANT.ALGO_MASTER_ACCOUNT;
  const amount = +amountStr * ALGO_UNIT;
  try {
    const response = await signGoNearTransaction(from, to, amount);
    // TODO: Err handling: no goNEAR in acc.
    return response.txId
  } catch (err) {
    console.error(err);
  }
}

const optInGoNear = async (addr) => {
  const response = await signGoNearTransaction(addr, addr, 0);
  return response.txId
}

async function checkOptedIn(addr, option = { showAlert: false }) {
  if (addr === undefined) {
    window.alert('checking opted-in for empty addr')
    $('#algorand-optin').style.display = 'default';
  }
  let accountInfo = await algodClient.accountInformation(addr).do();
  for (let assetInfo of accountInfo['assets']) {
    if (assetInfo['asset-id'] === GO_NEAR_ASA_ID) {
      if (option.showAlert) {
        window.alert('opted in')
      }
      return true
    }
  }
  if (option.showAlert) {
    window.alert('not opted in')
  }
  return false
}



const authorizeBurnTransaction = async (amount) => {
  const cbUrl = new URL('/redirect', window.location.href);
  cbUrl.searchParams.set('path', '/api/burn');
  cbUrl.searchParams.set('burn_amount', amount);
  cbUrl.searchParams.set('burn_to', burnReceiver.value);
  cbUrl.searchParams.set('burn_from', ALGORAND_ADDRESS);
  console.log('cbUrl : ', cbUrl.toString()); // DEV_LOG_TO_REMOVE

  let txnId = await requestSignGoNearTxn(amount)
  cbUrl.searchParams.set('burn_txnId', txnId);

  const callbackUrl = cbUrl.toString();
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 10000);
  });

  window.location.assign(callbackUrl)
  // burnConfirmPage.style.display = 'block';
  // burnFilledReceiver.textContent = burnReceiver.value
  // document.getElementById('burn-button').disabled = false
}

