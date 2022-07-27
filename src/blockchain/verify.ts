/**
 * Verify the transaction before adding it to the database.
 */

export { verifyBlockchainTxn };

import { ApiCallParam } from '../utils/type/type';

import { ConfirmOutcome } from './abstract-base';
import { getTokenImplBlockchain } from '../bridge/token-table';
import { getBridgeInfo } from '../bridge/bridge-info';
import { TxnParam } from '../common/src/type/blockchain';

async function verifyBlockchainTxn(
  apiCallParam: ApiCallParam
): Promise<ConfirmOutcome> {
  const blockchain = getTokenImplBlockchain(apiCallParam.from_token);

  const txnParam: TxnParam = {
    fromAddr: apiCallParam.from_addr,
    toAddr: blockchain.centralizedAddr,
    atomAmount: getBridgeInfo(
      apiCallParam.from_token,
      apiCallParam.to_token
    ).amountParser(apiCallParam.amount),
    txnId: apiCallParam.txn_id,
  };

  return await blockchain.confirmTxn(txnParam);
}
