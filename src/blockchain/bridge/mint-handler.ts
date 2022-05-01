export { mint };

import { BridgeError, ERRORS } from '../../utils/errors';
import { BridgeTxInfo, GenericTxInfo } from '../..';

import { TxType } from '..';
import { bridge_txn_handler } from './bridge-txn-handler';
import { goNearToAtom } from '../../utils/formatter';
import { literal } from '../../utils/literal';
import { logger } from '../../utils/logger';

async function mint(genericTxInfo: GenericTxInfo): Promise<BridgeTxInfo> {
  const { from, to, amount, txId } = genericTxInfo;
  if (
    from === undefined ||
    to === undefined ||
    amount === undefined ||
    txId === undefined
  ) {
    throw new BridgeError(ERRORS.TXN.MISSING_PARAM);
    // TODO: use zod
  }
  logger.info(literal.START_MINTING(amount, from, to));
  const bridgeTxInfo = await bridge_txn_handler(
    {
      fromAddr: from,
      toAddr: to,
      atom: BigInt(goNearToAtom(amount)),
      txId,
    },
    TxType.Mint
  );
  logger.info(literal.DONE_MINT);
  return bridgeTxInfo;
}

// `Burning ${amount} ALGO from ${from}(ALGO) to ${to}(NEAR)`;
