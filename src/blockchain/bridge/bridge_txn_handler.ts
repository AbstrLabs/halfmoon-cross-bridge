export { bridge_txn_handler };
import { type Addr, type TxID, TxType, Blockchain } from '..';
import { GenericTxInfo } from '../..';
import { log } from '../../utils/logger';
import { algoBlockchain } from '../algorand';
import { nearBlockchain } from '../near';

async function bridge_txn_handler(
  genericTxInfo: GenericTxInfo,
  txType: TxType
): Promise<void> {
  /* CONFIG */
  let receivingBlockchain: Blockchain;
  let sendingBlockchain: Blockchain;
  const { from, to, amount, txId } = genericTxInfo;
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
    ...genericTxInfo,
    to: 'abstrlabs.testnet',
  });
  await sendingBlockchain.makeTransaction({
    ...genericTxInfo,
    from: 'JMJLRBZQSTS6ZINTD3LLSXCW46K44EI2YZHYKCPBGZP3FLITIQRGPELOBE',
  });
  await sendingBlockchain.confirmTransaction({
    ...genericTxInfo,
    from: 'JMJLRBZQSTS6ZINTD3LLSXCW46K44EI2YZHYKCPBGZP3FLITIQRGPELOBE',
  });
  return;
  // check indexer with hash
}

const fake_makeTransaction = async (genericTxInfo: GenericTxInfo) => {
  throw new Error('not implemented!');
};

class AlgorandAcc {
  static makeTransaction(genericTxInfo: GenericTxInfo) {
    fake_makeTransaction(genericTxInfo);
  }
}

class NearAcc {
  static makeTransaction(genericTxInfo: GenericTxInfo) {
    fake_makeTransaction(genericTxInfo);
  }
}
