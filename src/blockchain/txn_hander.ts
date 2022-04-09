import { type addr, type TxID, TxType } from '.';
import { log } from '../utils/logger';
import { AlgorandIndexer } from './helper/algorand';
import { NearIndexer } from './helper/near';

async function bridge_txn_handler(
  from: addr,
  to: addr,
  amount: number,
  txId: TxID,
  txType: TxType
): Promise<void> {
  log(`Making ${txType} transaction of ${amount} from ${from} to ${to}`);
  let receiving_indexer;
  if (txType === TxType.Mint) {
    receiving_indexer = NearIndexer;
  } else if (txType === TxType.Burn) {
    receiving_indexer = AlgorandIndexer;
  } else {
    throw new Error('Unknown txType');
  }
  await receiving_indexer.confirmTransaction(txId, from);
  return;
  // check indexer with hash
}
