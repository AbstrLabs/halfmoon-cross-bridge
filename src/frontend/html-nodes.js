function algoAccNode(addr) {
  const link = document.createElement('a');
  link.title = addr;
  link.href = 'https://testnet.algoexplorer.io/address/' + addr;
  var linkText = document.createTextNode(link.title);
  link.appendChild(linkText);
  return link
}

function algoTxnIdNode(txnId) {
  const link = document.createElement('a');
  link.title = params.burn_txnId;
  link.href = 'https://testnet.algoexplorer.io/tx' + params.burn_txnId;
  var linkText = document.createTextNode(link.title);
  link.appendChild(linkText);
  return link
}

function nearAccNode(addr) {
  const link = document.createElement('a');
  link.title = addr;
  link.href = 'https://explorer.testnet.near.org/accounts/' + addr;
  var linkText = document.createTextNode(link.title);
  link.appendChild(linkText);
  return link
}
function nearTxnIdNode(txnId) {
  const link = document.createElement('a');
  link.title = txnId;
  link.href =
    'https://explorer.testnet.near.org/transactions/' + txnId;
  // copilot gave me this 'https://explorer.nearprotocol.com/transaction/' + txnId;
  var linkText = document.createTextNode(link.title);
  link.appendChild(linkText);
  return link
}

