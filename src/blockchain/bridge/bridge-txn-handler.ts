export { bridgeTxnHandler };

import { Blockchain, TxnType } from '..';
import { BlockchainName, BridgeTxnStatus } from '../..';
import { BridgeError, ERRORS } from '../../utils/errors';

import { BridgeTxnInfo } from '.';
import { ENV } from '../../utils/dotenv';
import { algoBlockchain } from '../algorand';
import { db } from '../../database';
import { literal } from '../../utils/literal';
import { logger } from '../../utils/logger';
import { nearBlockchain } from '../near';

async function bridgeTxnHandler(
  bridgeTxnInfo: BridgeTxnInfo
): Promise<BridgeTxnInfo> {
  /* CONFIG */
  let incomingBlockchain: Blockchain;
  let outgoingBlockchain: Blockchain;
  let txnType;
  if (
    bridgeTxnInfo.fromBlockchain === BlockchainName.NEAR &&
    bridgeTxnInfo.toBlockchain === BlockchainName.ALGO
  ) {
    txnType = TxnType.MINT;
    incomingBlockchain = nearBlockchain;
    outgoingBlockchain = algoBlockchain;
  } else if (
    bridgeTxnInfo.fromBlockchain === BlockchainName.ALGO &&
    bridgeTxnInfo.toBlockchain === BlockchainName.NEAR
  ) {
    txnType = TxnType.BURN;
    incomingBlockchain = algoBlockchain;
    outgoingBlockchain = nearBlockchain;
  } else {
    throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TX_TYPE, {
      txnType: txnType,
    });
  }
  logger.info(
    literal.MAKING_TXN(
      txnType,
      bridgeTxnInfo.fromAmountAtom,
      bridgeTxnInfo.fromAddr,
      bridgeTxnInfo.toAddr
    )
  );
  await db.connect();

  /* MAKE TRANSACTION */

  bridgeTxnInfo.dbId = await db.createMintTxn(bridgeTxnInfo);

  // update as sequence diagram
  bridgeTxnInfo.txnStatus = BridgeTxnStatus.CONFIRM_INCOMING;
  await db.updateMintTxn(bridgeTxnInfo);
  // should use if.
  await incomingBlockchain.confirmTxn({
    fromAddr: bridgeTxnInfo.fromAddr,
    atomAmount: bridgeTxnInfo.fromAmountAtom,
    toAddr: ENV.NEAR_MASTER_ADDR,
    txnId: bridgeTxnInfo.fromTxnId,
  });
  bridgeTxnInfo.txnStatus = BridgeTxnStatus.DONE_INCOMING;
  await db.updateMintTxn(bridgeTxnInfo);

  // TODO! calculate fee

  bridgeTxnInfo.txnStatus = BridgeTxnStatus.MAKE_OUTGOING;
  await db.updateMintTxn(bridgeTxnInfo);
  const outgoingTxnId = await outgoingBlockchain.makeOutgoingTxn({
    fromAddr: ENV.ALGO_MASTER_ADDR,
    toAddr: bridgeTxnInfo.toAddr,
    atomAmount: bridgeTxnInfo.fromAmountAtom,
    txnId: literal.UNUSED,
  });

  // verify outgoing tx
  bridgeTxnInfo.toTxnId = outgoingTxnId;
  bridgeTxnInfo.txnStatus = BridgeTxnStatus.VERIFY_OUTGOING;
  await db.updateMintTxn(bridgeTxnInfo);
  await outgoingBlockchain.confirmTxn({
    fromAddr: ENV.ALGO_MASTER_ADDR,
    toAddr: bridgeTxnInfo.toAddr,
    atomAmount: bridgeTxnInfo.fromAmountAtom,
    txnId: outgoingTxnId,
  });
  bridgeTxnInfo.txnStatus = BridgeTxnStatus.DONE_OUTGOING;
  await db.updateMintTxn(bridgeTxnInfo);

  // user confirmation via socket

  /* CLEAN UP */
  /* await  */ db.disconnect();

  return bridgeTxnInfo;
  // check indexer with hash
}
