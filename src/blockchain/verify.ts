/**
 * Verify the transaction before adding it to the database.
 */

export { verifyBlockchainTxn };

import { ApiCallParam, TxnParam } from '../utils/type/type';

import { BlockchainName } from '..';
import { toGoNearAtom } from '../utils/formatter';
import { ConfirmOutcome, type Blockchain } from './abstract-base';
import { nearBlockchain } from './near';
import { algoBlockchain } from './algorand';
import { TOKEN_TABLE } from '../bridge/token-table';

async function verifyBlockchainTxn(
  apiCallParam: ApiCallParam
): Promise<ConfirmOutcome> {
  let blockchain: Blockchain;
  const blockchainName = TOKEN_TABLE[apiCallParam.from_token].implBlockchain;
  // TODO: use match.
  if (blockchainName === BlockchainName.ALGO) {
    blockchain = algoBlockchain;
    // for extendability, we can add more blockchain names here.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (blockchainName === BlockchainName.NEAR) {
    blockchain = nearBlockchain;
  } else {
    // for extendability, we can add more blockchain names here.
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Blockchain ${blockchainName} is not supported.`);
  }
  const txnParam: TxnParam = {
    fromAddr: apiCallParam.from_addr,
    toAddr: blockchain.centralizedAddr,
    atomAmount: toGoNearAtom(apiCallParam.amount),
    txnId: apiCallParam.txn_id,
  };

  return await blockchain.confirmTxn(txnParam);
  // const expectedTxnOutcome = await blockchain.getTxnStatus(txnParam);
  // blockchain.verifyCorrectness(expectedTxnOutcome, txnParam);
}
