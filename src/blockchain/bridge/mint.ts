export { mint };

import { BridgeTxn } from '.';
import { MintApiParam } from '../..';
import { TxnType } from '..';
import { handleBridgeTxn } from './bridge-txn-handler';
import { literal } from '../../utils/literal';
import { logger } from '../../utils/logger';

async function mint(mintApiParam: MintApiParam): Promise<BridgeTxn> {
  logger.info(
    literal.START_MINTING(
      mintApiParam.amount,
      mintApiParam.from,
      mintApiParam.to
    )
  );
  const rawBridgeTxn = BridgeTxn.fromApiCallParam(mintApiParam, TxnType.MINT);
  const bridgeTxn = handleBridgeTxn(rawBridgeTxn);
  logger.info(literal.DONE_MINT);
  return bridgeTxn;
}
