/**
 * @exports mint - Create a {@link BridgeTxn} instance from {@link BurnApiParam} for minting, and execute the transaction.
 */
export { transact };

import { BridgeTxn, BridgeTxnObject } from '.';

import { MintApiParam } from '../utils/type';
import { TxnType } from '../blockchain';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';

/**
 * Create a {@link BridgeTxn} instance from {@link MintApiParam} for minting, and execute the transaction.
 *
 * @async
 * @param  {MintApiParam} mintApiParam
 * @returns {Promise<BridgeTxnObject>} A BridgeTxnObject representing the burn bridge transaction.
 */
async function transact(mintApiParam: MintApiParam): Promise<BridgeTxnObject> {
  logger.info(
    literals.START_MINTING(
      mintApiParam.amount,
      mintApiParam.from,
      mintApiParam.to
    )
  );
  const bridgeTxn = BridgeTxn.fromApiCallParam(mintApiParam, TxnType.MINT);
  const bridgeTxnObject = await bridgeTxn.runWholeBridgeTxn();
  logger.info(literals.DONE_MINT);
  return bridgeTxnObject;
}
