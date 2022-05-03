export { mint };

import { BridgeError, ERRORS } from '../../utils/errors';
import { apiParamToBridgeTxnInfo, goNearToAtom } from '../../utils/formatter';

import { BridgeTxnInfo } from '.';
import { MintApiParam } from '../..';
import { TxnType } from '..';
import { bridgeTxnHandler } from './bridge-txn-handler';
import { literal } from '../../utils/literal';
import { logger } from '../../utils/logger';

async function mint(mintApiParam: MintApiParam): Promise<BridgeTxnInfo> {
  const { from, to, amount, txnId } = mintApiParam;
  logger.info(literal.START_MINTING(amount, from, to));
  const rawBridgeTxnInfo = apiParamToBridgeTxnInfo(
    {
      fromAddr: from,
      toAddr: to,
      atomAmount: goNearToAtom(amount),
      txnId,
    },
    TxnType.MINT,
    BigInt(Date.now())
  );
  const bridgeTxnInfo = bridgeTxnHandler(rawBridgeTxnInfo);
  logger.info(literal.DONE_MINT);
  return bridgeTxnInfo;
}
