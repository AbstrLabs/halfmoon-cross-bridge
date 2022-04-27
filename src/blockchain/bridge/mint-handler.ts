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
import { BridgeTxInfo, GenericTxInfo } from '../..';
import { sleep } from '../../utils/helper';
import { logger } from '../../utils/logger';
import { bridge_txn_handler } from './bridge-txn-handler';

async function mint(genericTxInfo: GenericTxInfo): Promise<BridgeTxInfo> {
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
  logger.info(`Minting ${amount} NEAR from ${from}(NEAR) to ${to}(ALGO)`);
  const bridgeTxInfo = await bridge_txn_handler(genericTxInfo, TxType.Mint);
  logger.info('mint success');
  return bridgeTxInfo;
}

// `Burning ${amount} ALGO from ${from}(ALGO) to ${to}(NEAR)`;
