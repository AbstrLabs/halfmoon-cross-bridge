export { burn };

import { BridgeTxnInfo } from '.';
import { BurnApiParam } from '../..';
import { TxnType } from '..';
import { bridgeTxnHandler } from './bridge-txn-handler';
import { literal } from '../../utils/literal';
import { logger } from '../../utils/logger';

async function burn(burnApiParam: BurnApiParam): Promise<BridgeTxnInfo> {
  logger.info(
    literal.START_MINTING(
      burnApiParam.amount,
      burnApiParam.from,
      burnApiParam.to
    )
  );
  const rawBridgeTxnInfo = BridgeTxnInfo.fromApiCallParam(
    burnApiParam,
    TxnType.BURN,
    BigInt(Date.now())
  );
  const bridgeTxnInfo = await bridgeTxnHandler(rawBridgeTxnInfo);
  // ERR handler .burn success
  logger.info(literal.DONE_BURN);
  return bridgeTxnInfo;
}
