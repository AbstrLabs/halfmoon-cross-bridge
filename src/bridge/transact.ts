/**
 * @exports mint - Create a {@link BridgeTxn} instance from {@link BurnApiParam} for minting and burning, and execute the transaction.
 * @deprecated - deprecating, use bridge-worker
 */
export { _create, _execute };

import { ApiCallParam } from '../utils/type';
import { BridgeTxn, BridgeTxnObj } from '.';

import { txnHandler } from './txn-handler';
import { apiWorker } from './api-worker';

/**
 * Create a {@link BridgeTxn} instance from {@link ApiCallParam} for minting and burning, but not execute the transaction.
 *
 * @deprecated - use apiWorker.create()
 * @async
 * @param  {ApiCallParam} apiCallParam
 * @returns {Promise<BridgeTxn>} A BridgeTxnObject representing the burn bridge transaction.
 */
// eslint-disable-next-line @typescript-eslint/require-await
async function _create(apiCallParam: ApiCallParam): Promise<BridgeTxn> {
  /* CREATE */
  return await apiWorker.create(apiCallParam);
}

/**
 * @deprecated - use new API model, the txnHandler will execute the transaction.
 */
async function _execute(bridgeTxn: BridgeTxn): Promise<BridgeTxnObj> {
  const bridgeTxnObject = await txnHandler._execute(bridgeTxn);
  // TODO: ERR handler .burn success
  return bridgeTxnObject;
}
