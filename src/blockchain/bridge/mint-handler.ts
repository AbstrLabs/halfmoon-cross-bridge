export { mint };

import { BridgeError, ERRORS } from '../../utils/errors';
import { BridgeTxnInfo, MintApiParam } from '../..';
import { apiParamToBridgeTxnInfo, goNearToAtom } from '../../utils/formatter';

import { TxnType } from '..';
import { bridgeTxnHandler } from './bridge-txn-handler';
import { literal } from '../../utils/literal';
import { logger } from '../../utils/logger';

async function mint(mintApiParam: MintApiParam): Promise<BridgeTxnInfo> {
  const { from, to, amount, txId } = mintApiParam;
  logger.info(literal.START_MINTING(amount, from, to));
  const rawBridgeTxnInfo = apiParamToBridgeTxnInfo(
    {
      fromAddr: from,
      toAddr: to,
      atomAmount: BigInt(goNearToAtom(amount)),
      txId,
    },
    TxnType.Mint,
    BigInt(Date.now())
  );
  const bridgeTxnInfo = bridgeTxnHandler(rawBridgeTxnInfo);
  logger.info(literal.DONE_MINT);
  return bridgeTxnInfo;
}
