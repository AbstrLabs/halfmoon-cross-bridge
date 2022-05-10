export { mint };

import { BridgeTxn } from '.';
import { MintApiParam } from '../utils/type';
import { TxnType } from '../blockchain';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';

async function mint(mintApiParam: MintApiParam): Promise<BridgeTxn> {
  logger.info(
    literals.START_MINTING(
      mintApiParam.amount,
      mintApiParam.from,
      mintApiParam.to
    )
  );
  const rawBridgeTxn = BridgeTxn.fromApiCallParam(mintApiParam, TxnType.MINT);
  const bridgeTxn = await rawBridgeTxn.runWholeBridgeTxn();
  logger.info(literals.DONE_MINT);
  return bridgeTxn;
}
