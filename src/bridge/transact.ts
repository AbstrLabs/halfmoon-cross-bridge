/**
 * @exports mint - Create a {@link BridgeTxn} instance from {@link BurnApiParam} for minting and burning, and execute the transaction.
 */
export { create, execute };

import { ApiCallParam, Stringer } from '../utils/type';
import { BridgeError, ERRORS } from '../utils/errors';
import { BridgeTxn, BridgeTxnObj } from '.';

import { TxnType } from '../blockchain';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';
import { txnHandler } from './txn-handler';
import { creationQueue } from './creation-queue';
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
  /* LOGGING */
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

  /* CREATE */
  const bridgeTxn = BridgeTxn.fromApiCallParam(
    apiCallParam,
    BigInt(Date.now())
  );

  // TODO: this is a quick fix for test, need update TODO-ID:CQA
  creationQueue.add({
    txnId: apiCallParam.txnId,
    fromBlockchainName:
      apiCallParam.type == TxnType.MINT
        ? BlockchainName.ALGO
        : BlockchainName.NEAR,
  });

  logger.info(_literals.DONE);
  return bridgeTxn;
}

async function execute(bridgeTxn: BridgeTxn): Promise<BridgeTxnObj> {
  const bridgeTxnObject = await txnHandler._execute(bridgeTxn);
  // TODO: ERR handler .burn success
  return bridgeTxnObject;
}
