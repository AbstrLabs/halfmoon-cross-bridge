export { mint };

import { BridgeError, ERRORS } from '../../utils/errors';
import { BridgeTxInfo, MintApiParam } from '../..';

import { TxType } from '..';
import { bridge_txn_handler } from './bridge-txn-handler';
import { goNearToAtom } from '../../utils/formatter';
import { literal } from '../../utils/literal';
import { logger } from '../../utils/logger';

async function mint(mintApiParam: MintApiParam): Promise<BridgeTxInfo> {
  const { from, to, amount, txId } = mintApiParam;
  logger.info(literal.START_MINTING(amount, from, to));
  // TODO: move conversion to server side. use BridgeTxInfo
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
