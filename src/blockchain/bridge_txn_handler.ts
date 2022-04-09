export { bridge_txn_handler };
import { type addr, type TxID, TxType } from '.';
import { BridgeTxnParam } from '..';
import { log } from '../utils/logger';
import { AlgorandIndexer } from './helper/algorand';
import { NearIndexer } from './helper/near';

async function bridge_txn_handler(
  bridgeTxnParam: BridgeTxnParam,
  txType: TxType
): Promise<void> {
  const { from, to, amount, txId } = bridgeTxnParam;
  log(`Making ${txType} transaction of ${amount} from ${from} to ${to}`);
  let receiving_indexer;
  if (txType === TxType.Mint) {
    receiving_indexer = NearIndexer;
  } else if (txType === TxType.Burn) {
    receiving_indexer = AlgorandIndexer;
  } else {
    throw new Error('Unknown txType');
  }
  await receiving_indexer.confirmTransaction(bridgeTxnParam);
  return;
  // check indexer with hash
}
