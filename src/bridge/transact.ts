/**
 * @exports mint - Create a {@link BridgeTxn} instance from {@link BurnApiParam} for minting and burning, and execute the transaction.
 */
export { transact };

import { ApiCallParam, Stringer } from '../utils/type';
import { BridgeError, ERRORS } from '../utils/errors';
import { BridgeTxn, BridgeTxnObject } from '.';

import { TxnType } from '../blockchain';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';

/**
 * Create a {@link BridgeTxn} instance from {@link ApiCallParam} for minting and burning, and execute the transaction.
 *
 * @async
 * @param  {ApiCallParam} apiCallParam
 * @returns {Promise<BridgeTxnObject>} A BridgeTxnObject representing the burn bridge transaction.
 */
async function transact(apiCallParam: ApiCallParam): Promise<BridgeTxnObject> {
  /* SETUP */
  let _literals: {
    START: (amount: Stringer, from: Stringer, to: Stringer) => string;
    DONE: string;
  };
  if (apiCallParam.type === TxnType.MINT) {
    _literals = {
      START: literals.START_MINTING,
      DONE: literals.DONE_MINT,
    };
    // for extendability, we can add more txn types here.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (apiCallParam.type === TxnType.BURN) {
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

  /* EXECUTE */
  const bridgeTxn = BridgeTxn.fromApiCallParam(
    apiCallParam,
    BigInt(Date.now())
  );
  const bridgeTxnObject = await bridgeTxn.runWholeBridgeTxn();

  // TODO: ERR handler .burn success
  logger.info(_literals.DONE);
  return bridgeTxnObject;
}
