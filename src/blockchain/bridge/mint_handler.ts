export { mint };

import {
  type AlgoAddr,
  type NearAddr,
  type Addr,
  type NearTxId,
  type AlgoTxId,
  type TxID,
  TxType,
} from '..';
import { GenericTxInfo } from '../..';
import { sleep } from '../../utils/helper';
import { log } from '../../utils/logger';
import { bridge_txn_handler } from './bridge_txn_handler';

async function mint(genericTxInfo: GenericTxInfo): Promise<void> {
  const { from, to, amount, txId } = genericTxInfo;

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
  await bridge_txn_handler(genericTxInfo, TxType.Mint);
  log('fake mint success');
  return;
}

// `Burning ${amount} ALGO from ${from}(ALGO) to ${to}(NEAR)`;
