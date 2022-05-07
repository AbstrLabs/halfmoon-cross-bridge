export { mint };

import { BridgeTxnInfo } from '.';
import { MintApiParam } from '../..';
import { TxnType } from '..';
import { bridgeTxnHandler } from './bridge-txn-handler';
import { literal } from '../../utils/literal';
import { logger } from '../../utils/logger';

async function mint(mintApiParam: MintApiParam): Promise<BridgeTxnInfo> {
  logger.info(
    literal.START_MINTING(
      mintApiParam.amount,
      mintApiParam.from,
      mintApiParam.to
    )
  );
  const rawBridgeTxnInfo = BridgeTxnInfo.fromApiCallParam(
    mintApiParam,
    TxnType.MINT
  );
  const bridgeTxnInfo = bridgeTxnHandler(rawBridgeTxnInfo);
  logger.info(literal.DONE_MINT);
  return bridgeTxnInfo;
}