export { bridge_txn_handler };
import { type addr, type TxID, TxType } from '..';
import { BridgeTxnParam } from '../..';
import { log } from '../../utils/logger';
import { algoBlockchain } from '../algorand';
import { NearBlockchain } from '../near';

async function bridge_txn_handler(
  bridgeTxnParam: BridgeTxnParam,
  txType: TxType
): Promise<void> {
  /* CONFIG */
  let receiving_indexer;
  let sending_indexer;
  let sending_account;
  const { from, to, amount, txId } = bridgeTxnParam;
  log(`Making ${txType} transaction of ${amount} from ${from} to ${to}`);
  if (txType === TxType.Mint) {
    receiving_indexer = NearBlockchain;
    sending_indexer = algoBlockchain;
    sending_account = AlgorandAcc;
  } else if (txType === TxType.Burn) {
    receiving_indexer = algoBlockchain;
    sending_indexer = NearBlockchain;
    sending_account = NearAcc;
  } else {
    throw new Error('Unknown txType');
  }

  /* MAKE TRANSACTION */
  await receiving_indexer.confirmTransaction({
    ...bridgeTxnParam,
    to: 'abstrlabs.testnet',
  });
  await sending_account.makeTransaction({
    ...bridgeTxnParam,
    from: 'JMJLRBZQSTS6ZINTD3LLSXCW46K44EI2YZHYKCPBGZP3FLITIQRGPELOBE',
  });
  await sending_indexer.confirmTransaction({
    ...bridgeTxnParam,
    from: 'JMJLRBZQSTS6ZINTD3LLSXCW46K44EI2YZHYKCPBGZP3FLITIQRGPELOBE',
  });
  return;
  // check indexer with hash
}

const fake_makeTransaction = async (bridgeTxnParam: BridgeTxnParam) => {
  throw new Error('not implemented!');
};

class AlgorandAcc {
  static makeTransaction(bridgeTxnParam: BridgeTxnParam) {
    fake_makeTransaction(bridgeTxnParam);
  }
}

class NearAcc {
  static makeTransaction(bridgeTxnParam: BridgeTxnParam) {
    fake_makeTransaction(bridgeTxnParam);
  }
}
