/**
 * Verify the transaction before adding it to the database.
 */

export { verifyBlockchainTxn };

import { ApiCallParam, TxnParam } from '../utils/type';

import { BlockchainName } from '..';
import { toGoNearAtom } from '../utils/formatter';
import { type Blockchain } from '.';
import { nearBlockchain } from './near';
import { algoBlockchain } from './algorand';

async function verifyBlockchainTxn(
  apiCallParam: ApiCallParam,
  blockchainName: BlockchainName
) {
  let blockchain: Blockchain;

  // TODO: wrap inferBlockchainName in a function in blockchain/index.ts
  if (blockchainName === BlockchainName.ALGO) {
    blockchain = algoBlockchain;
  } else if (blockchainName === BlockchainName.NEAR) {
    blockchain = nearBlockchain;
  } else {
    throw new Error(`Blockchain ${blockchainName} is not supported.`);
  }
  const txnParam: TxnParam = {
    fromAddr: apiCallParam.from,
    toAddr: blockchain.centralizedAddr,
    atomAmount: toGoNearAtom(apiCallParam.amount),
    txnId: apiCallParam.txnId,
  };

  return await blockchain.confirmTxn(txnParam);
  // const expectedTxnOutcome = await blockchain.getTxnStatus(txnParam);
  // blockchain.verifyCorrectness(expectedTxnOutcome, txnParam);
}
