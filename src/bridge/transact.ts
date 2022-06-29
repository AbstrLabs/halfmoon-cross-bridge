/**
 * @exports mint - Create a {@link BridgeTxn} instance from {@link BurnApiParam} for minting and burning, and execute the transaction.
 * @deprecated - deprecating, use bridge-worker
 */
export { create, _execute };

import { ApiCallParam } from '../utils/type';
import { BridgeTxn, BridgeTxnObj } from '.';

import { logger } from '../utils/logger';
import { txnHandler } from './txn-handler';
import { bridgeWorker } from './bridge-worker';

/**
 * Create a {@link BridgeTxn} instance from {@link ApiCallParam} for minting and burning, but not execute the transaction.
 *
 * @async
 * @param  {ApiCallParam} apiCallParam
 * @returns {Promise<BridgeTxnObj>} A BridgeTxnObject representing the burn bridge transaction.
 */
// eslint-disable-next-line @typescript-eslint/require-await
async function create(apiCallParam: ApiCallParam): Promise<BridgeTxn> {
  /* CREATE */
  // TODO: this is a quick fix for test, need update TODO-ID:CQA
  bridgeWorker.add(apiCallParam);

  const bridgeTxn = BridgeTxn.fromApiCallParam(
    apiCallParam,
    BigInt(Date.now())
  );

  await bridgeTxn.createInDb();
  txnHandler.queue.push(bridgeTxn);

  // TODO: this is a quick fix for test, need update TODO-ID:CQA
  bridgeWorker.remove(apiCallParam);

  logger.info(`created bridge txn with uid: ${bridgeTxn.uid.toString()}`);

  return bridgeTxn;
}

/**
 * @deprecated - use new API model, the txnHandler will execute the transaction.
 */
async function _execute(bridgeTxn: BridgeTxn): Promise<BridgeTxnObj> {
  const bridgeTxnObject = await txnHandler._execute(bridgeTxn);
  // TODO: ERR handler .burn success
  return bridgeTxnObject;
}
