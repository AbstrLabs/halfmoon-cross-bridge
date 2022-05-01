export { mint };

import { BridgeError, ERRORS } from '../../utils/errors';
import { BridgeTxInfo, MintApiParam } from '../..';
import { apiParamToBridgeTxInfo, goNearToAtom } from '../../utils/formatter';

import { TxType } from '..';
import { bridge_txn_handler } from './bridge-txn-handler';
import { literal } from '../../utils/literal';
import { logger } from '../../utils/logger';

async function mint(mintApiParam: MintApiParam): Promise<BridgeTxInfo> {
  const { from, to, amount, txId } = mintApiParam;
  logger.info(literal.START_MINTING(amount, from, to));
  const rawBridgeTxInfo = apiParamToBridgeTxInfo(
    {
      fromAddr: from,
      toAddr: to,
      atom: BigInt(goNearToAtom(amount)),
      txId,
    },
    TxType.Mint,
    BigInt(Date.now())
  );
  const bridgeTxInfo = bridge_txn_handler(rawBridgeTxInfo);
  logger.info(literal.DONE_MINT);
  return bridgeTxInfo;
}
