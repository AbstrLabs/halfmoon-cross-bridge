export { bridge_txn_handler };
import { type Addr, type TxID, TxType, Blockchain } from '..';
import { GeneralTxInfo } from '../..';
import { log } from '../../utils/logger';
import { algoBlockchain } from '../algorand';
import { nearBlockchain } from '../near';

async function bridge_txn_handler(
  bridgeTxnParam: GeneralTxInfo,
  txType: TxType
): Promise<void> {
  /* CONFIG */
  let receivingBlockchain: Blockchain;
  let sendingBlockchain: Blockchain;
  const { from, to, amount, txId } = bridgeTxnParam;
  log(`Making ${txType} transaction of ${amount} from ${from} to ${to}`);
  if (txType === TxType.Mint) {
    receivingBlockchain = nearBlockchain;
    sendingBlockchain = algoBlockchain;
  } else if (txType === TxType.Burn) {
    receivingBlockchain = algoBlockchain;
    sendingBlockchain = nearBlockchain;
  } else {
    throw new Error('Unknown txType');
  }

  /* MAKE TRANSACTION */
  await receivingBlockchain.confirmTransaction({
    ...bridgeTxnParam,
    to: 'abstrlabs.testnet',
  });
  await sendingBlockchain.makeTransaction({
    ...bridgeTxnParam,
    from: 'JMJLRBZQSTS6ZINTD3LLSXCW46K44EI2YZHYKCPBGZP3FLITIQRGPELOBE',
  });
  await sendingBlockchain.confirmTransaction({
    ...bridgeTxnParam,
    from: 'JMJLRBZQSTS6ZINTD3LLSXCW46K44EI2YZHYKCPBGZP3FLITIQRGPELOBE',
  });
  return;
  // check indexer with hash
}

const fake_makeTransaction = async (bridgeTxnParam: GeneralTxInfo) => {
  throw new Error('not implemented!');
};

class AlgorandAcc {
  static makeTransaction(bridgeTxnParam: GeneralTxInfo) {
    fake_makeTransaction(bridgeTxnParam);
  }
}

class NearAcc {
  static makeTransaction(bridgeTxnParam: GeneralTxInfo) {
    fake_makeTransaction(bridgeTxnParam);
  }
}
