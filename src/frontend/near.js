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

let nearConnectButton = document.getElementById('near-connect-btn');
let nearSignOutButton = document.getElementById('near-signout-btn');
let nearAddress = document.getElementById('near-address');
let nearTransferButton = document.getElementById('near-transfer');

if (!nearWallet.isSignedIn()) {
  nearConnectButton.textContent = 'Sign In with NEAR wallet'
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
  receiver: receiverId,
  amount: amountStr
}) {
  const action = new nearApi.transactions.transfer(nearApi.utils.format.parseNearAmount(amountStr));
  const ak = await nearWallet.account().findAccessKey(nearWallet.getAccountId(), []);

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

function requestSignNearTxn(tx) {
  nearWallet.requestSignTransactions({ transactions: [tx] });
}

async function nearTest(amount) {
  console.log('amount : ', amount); // DEV_LOG_TO_REMOVE

  let tx = await createNearTxn({ receiver: 'abstrlabs.testnet', amount })
  requestSignNearTxn(tx)
  return
}

/* NEAR transaction check*/
let nearTxhash = document.getElementById('mint_txnId');
let nearSigner = document.getElementById('mint_from');

let nearAmount = document.getElementById('mint_amount_filled');
let filledTx = document.getElementById('mint_txnId_filled');
let filledAccount = document.getElementById('mint_from_filled');

const checkNearTx = async (event) => {
  event.preventDefault()
  try {
    const result = await near.connection.provider.txStatus(nearTxhash.value, nearSigner.value)
    console.log(result.status.SuccessValue === "")
    let NEARamount = nearApi.utils.format.formatNearAmount(result.transaction.actions[0].Transfer.deposit)
    if (result.status.SuccessValue === "") {
      nearAmount.textContent = NEARamount
      filledTx.textContent = result.transaction.hash
      filledAccount.textContent = result.transaction.signer_id
    }
  } catch (err) {
    console.error(err);
  }
}// change after get api method

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