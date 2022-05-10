export { burn };

import { BridgeTxn, BridgeTxnObject } from '.';

import { BurnApiParam } from '../utils/type';
import { TxnType } from '../blockchain';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';

async function burn(burnApiParam: BurnApiParam): Promise<BridgeTxnObject> {
  logger.info(
    literals.START_MINTING(
      burnApiParam.amount,
      burnApiParam.from,
      burnApiParam.to
    )
  );
  const bridgeTxn = BridgeTxn.fromApiCallParam(
    burnApiParam,
    TxnType.BURN,
    BigInt(Date.now())
  );
  const bridgeTxnObject = await bridgeTxn.runWholeBridgeTxn();
  // ERR handler .burn success
  logger.info(literals.DONE_BURN);
  return bridgeTxnObject;
}
