export { mint };

import { BridgeTxn, BridgeTxnObject } from '.';

import { MintApiParam } from '../utils/type';
import { TxnType } from '../blockchain';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';

async function mint(mintApiParam: MintApiParam): Promise<BridgeTxnObject> {
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
