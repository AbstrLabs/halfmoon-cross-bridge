export { mint };

import {
  type AlgoAddr,
  type NearAddr,
  type Addr,
  type NearTxHash,
  type AlgoTxnId,
  type TxID,
  TxType,
} from '..';
import { GeneralTxInfo } from '../..';
import { sleep } from '../../utils/helper';
import { log } from '../../utils/logger';
import { bridge_txn_handler } from './bridge_txn_handler';

async function mint(bridgeTxnParam: GeneralTxInfo): Promise<void> {
  const { from, to, amount, txId } = bridgeTxnParam;

  if (
    from === undefined ||
    to === undefined ||
    amount === undefined ||
    txId === undefined
  ) {
    throw new Error('Missing required params');
  }
  // const amount = +amount;
  log(`Minting ${amount} NEAR from ${from}(NEAR) to ${to}(ALGO)`);
  await bridge_txn_handler(bridgeTxnParam, TxType.Mint);
  log('fake mint success');
  return;
}

// `Burning ${amount} ALGO from ${from}(ALGO) to ${to}(NEAR)`;
