// TODO: 3. Check if fromTxnId is reused

export { handleBridgeTxn as handleBridgeTxn };

import { BridgeTxn } from '.';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';

async function handleBridgeTxn(bridgeTxn: BridgeTxn): Promise<BridgeTxn> {
  logger.info(
    literals.MAKING_TXN(
      `${bridgeTxn.fromBlockchain}->${bridgeTxn.toBlockchain}`,
      bridgeTxn.fromAmountAtom,
      bridgeTxn.fromAddr,
      bridgeTxn.toAddr
    )
  );
  await bridgeTxn.confirmIncomingTxn();
  await bridgeTxn.makeOutgoingTxn();
  await bridgeTxn.verifyOutgoingTxn();
  return bridgeTxn;
}
