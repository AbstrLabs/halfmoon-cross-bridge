/* NEAR wallet CONNECT and function */

// modified from https://docs.near.org/docs/faq/naj-faq
// connect to NEAR
// imported nearApi

/* RPC provider, not needed */
// networkId = 'testnet'
// const nearProvider = new nearApi.providers.JsonRpcProvider(
//   `https://rpc.${networkId}.near.org`
// );

const near = new nearApi.Near({
  keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore(),
  networkId: 'testnet',
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://wallet.testnet.near.org'
});


// connect to the NEAR Wallet
const nearWallet = new nearApi.WalletConnection(near, 'algorand-bridge');

let nearConnectButton = $('#near-connect-btn')[0];
let nearSignOutButton = $('#near-signout-btn')[0];
let nearAddress = $('#near-address')[0];
let nearTransferButton = $('#near-request-transfer')[0];

if (!nearWallet.isSignedIn()) {
  nearConnectButton.textContent = 'Sign In with NEAR wallet'
  nearTransferButton.disabled = 'Sign In to mint'
  nearTransferButton.disabled = true
} else if (nearWallet.isSignedIn()) {
  nearConnectButton.textContent = 'NEAR Wallet Connected'
  nearAddress.textContent = ' ' + nearWallet.getAccountId().toString()
  nearTransferButton.disabled = false
}

// Either sign in or transaction method on button click
nearConnectButton.addEventListener('click', () => {
  if (nearWallet.isSignedIn()) {
    nearConnectButton.disabled = true;
    nearSignOutButton.style.display = 'block';
  } else {
    nearConnectButton.textContent = 'loading...'
    nearWallet.requestSignIn('abstrlabs.testnet');
  }
});

nearSignOutButton.addEventListener('click', () => {
  if (nearWallet.isSignedIn()) {
    nearWallet.signOut();
    nearSignOutButton.textContent = 'loading...'
    location.reload();
  }
});

/* GET WALLET ACCOUNT */

const nearWalletAccount = nearWallet.account();

/* MAKE TXN */

async function createNearTxn({
  receiverId,
  amountStr
}) {
  const action = new nearApi.transactions.transfer(nearApi.utils.format.parseNearAmount(amountStr));
  const ak = await nearWalletAccount.findAccessKey(nearWallet.getAccountId(), []);

  const recentBlockHash = nearApi.utils.serialize.base_decode(
    // https://docs.near.org/docs/tutorials/create-transactions#6-blockhash
    ak.accessKey.block_hash
  );

  const tx = new nearApi.transactions.Transaction({
    signerId: nearWallet.getAccountId(),
    publicKey: ak.publicKey,
    nonce: ++ak.accessKey.nonce,
    receiverId,
    actions: [action],
    blockHash: recentBlockHash,
  });
  return tx;
}

async function requestSignNearTxn(amountStr, callbackUrl = undefined) {
  let tx = await createNearTxn({ receiverId: 'abstrlabs.testnet', amountStr })
  nearWallet.requestSignTransactions({ transactions: [tx], callbackUrl });
}

async function authorizeMintTransaction(amountStr) {
  const cbUrl = new URL('/redirect', window.location.href);
  cbUrl.searchParams.set('path', '/api/mint');
  cbUrl.searchParams.set('mint_amount', amountStr);
  cbUrl.searchParams.set('mint_to', mintReceiver.value);
  cbUrl.searchParams.set('mint_from', nearWallet.getAccountId().toString());
  const callbackUrl = cbUrl.toString();
  await requestSignNearTxn(amountStr, callbackUrl);
  return
}


/* NEAR transaction check*/
let nearTxhash = document.getElementById('mint_txnId');
let nearSigner = document.getElementById('mint_from');

let nearAmount = document.getElementById('mint_amount_filled');
let filledTx = document.getElementById('mint_txnId_filled');
let filledAccount = document.getElementById('mint_from_filled');

/* confirm mint */
let mintConfirmPage = document.getElementById('mint-confirm-page');
let mintReceiver = document.getElementById('mint_to');
let mintFilledReceiver = document.getElementById('mint_to_filled');
const confirmMint = (event) => {
  event.preventDefault();
  mintConfirmPage.style.display = 'block';
  mintFilledReceiver.textContent = mintReceiver.value
  document.getElementById('mint-button').disabled = false
}

/* mint*/
const startMint = async () => {
  // fill in after get api
}