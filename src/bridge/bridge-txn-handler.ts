export { handleBridgeTxn };

import { BridgeTxn } from '.';

async function handleBridgeTxn(bridgeTxn: BridgeTxn): Promise<BridgeTxn> {
  return await bridgeTxn.runWholeBridgeTxn();
}
