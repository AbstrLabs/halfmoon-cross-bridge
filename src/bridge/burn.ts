/**
 * @exports burn - Create a {@link BridgeTxn} instance from {@link ApiCallParam} for burning and execute the transaction.
 */
export { burn };

import { ApiCallParam, Stringer } from '../utils/type';
import { BridgeError, ERRORS } from '../utils/errors';
import { BridgeTxn, BridgeTxnObject } from '.';

import { TxnType } from '../blockchain';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';

/**
 * Create a {@link BridgeTxn} instance from {@link ApiCallParam} for burning and execute the transaction.
 *
 * @async
 * @param  {ApiCallParam} apiCallParam
 * @returns {Promise<BridgeTxnObject>} A BridgeTxnObject representing the burn bridge transaction.
 */
async function burn(apiCallParam: ApiCallParam): Promise<BridgeTxnObject> {
  let _literals: {
    START: (amount: Stringer, from: Stringer, to: Stringer) => string;
    DONE: string;
  };
  if (apiCallParam.txnType === TxnType.MINT) {
    _literals = {
      START: literals.START_MINTING,
      DONE: literals.DONE_MINT,
    };
  } else if (apiCallParam.txnType === TxnType.BURN) {
    _literals = {
      START: literals.START_BURNING,
      DONE: literals.DONE_BURN,
    };
  } else {
    throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
      at: 'transact',
      apiCallParam,
    });
  }
  logger.info(
    _literals.START(apiCallParam.amount, apiCallParam.from, apiCallParam.to)
  );
  const bridgeTxn = BridgeTxn.fromApiCallParam(
    apiCallParam,
    BigInt(Date.now())
  );
  const bridgeTxnObject = await bridgeTxn.runWholeBridgeTxn();
  // ERR handler .burn success
  logger.info(_literals.DONE);
  return bridgeTxnObject;
}
