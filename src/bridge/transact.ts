/**
 * @exports mint - Create a {@link BridgeTxn} instance from {@link BurnApiParam} for minting and burning, and execute the transaction.
 */
export { create, _execute };

import { ApiCallParam } from '../utils/type';
import { BridgeTxn, BridgeTxnObj } from '.';

import { TxnType } from '../blockchain';
import { logger } from '../utils/logger';
import { txnHandler } from './txn-handler';
import { bridgeWorker } from './bridge-worker';
import { BlockchainName } from '..';

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
  bridgeWorker.add({
    txnId: apiCallParam.txnId,
    fromBlockchainName:
      apiCallParam.type == TxnType.MINT
        ? BlockchainName.ALGO
        : BlockchainName.NEAR,
  });

  const bridgeTxn = BridgeTxn.fromApiCallParam(
    apiCallParam,
    BigInt(Date.now())
  );

  await bridgeTxn.createInDb();
  txnHandler.queue.push(bridgeTxn);

  // TODO: this is a quick fix for test, need update TODO-ID:CQA
  bridgeWorker.remove({
    fromBlockchainName:
      apiCallParam.type == TxnType.MINT
        ? BlockchainName.ALGO
        : BlockchainName.NEAR,
    txnId: apiCallParam.txnId,
  });

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
