/**
 * @exports burn - Create a {@link BridgeTxn} instance from {@link BurnApiParam} for burning and execute the transaction.
 */
export { burn };

import { BridgeTxn, BridgeTxnObject } from '.';

import { BurnApiParam } from '../utils/type';
import { TxnType } from '../blockchain';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';

/**
 * Create a {@link BridgeTxn} instance from {@link BurnApiParam} for burning and execute the transaction.
 *
 * @async
 * @param  {BurnApiParam} burnApiParam
 * @returns {Promise<BridgeTxnObject>} A BridgeTxnObject representing the burn bridge transaction.
 */
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
