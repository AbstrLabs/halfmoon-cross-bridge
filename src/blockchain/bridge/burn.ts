export { burn };

import { BridgeTxn } from '.';
import { BurnApiParam } from '../..';
import { TxnType } from '..';
import { handleBridgeTxn } from './bridge-txn-handler';
import { literals } from '../../utils/literals';
import { logger } from '../../utils/logger';

async function burn(burnApiParam: BurnApiParam): Promise<BridgeTxn> {
  logger.info(
    literals.START_MINTING(
      burnApiParam.amount,
      burnApiParam.from,
      burnApiParam.to
    )
  );
  const rawBridgeTxn = BridgeTxn.fromApiCallParam(
    burnApiParam,
    TxnType.BURN,
    BigInt(Date.now())
  );
  const bridgeTxn = await handleBridgeTxn(rawBridgeTxn);
  // ERR handler .burn success
  logger.info(literals.DONE_BURN);
  return bridgeTxn;
}
