// TODO: add error handling
// TODO: maybe merge to BridgeTxn class
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
    throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
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

  /* MAKE BRIDGE TRANSACTION */
  // update as sequence diagram

  bridgeTxnInfo.dbId = await db.createMintTxn(bridgeTxnInfo);

  bridgeTxnInfo.txnStatus = BridgeTxnStatus.DOING_INCOMING;
  await db.updateMintTxn(bridgeTxnInfo);
  // TODO: should use if.
  await incomingBlockchain.confirmTxn({
    fromAddr: bridgeTxnInfo.fromAddr,
    atomAmount: bridgeTxnInfo.fromAmountAtom,
    toAddr: ENV.NEAR_MASTER_ADDR,
    txnId: bridgeTxnInfo.fromTxnId,
  });
  bridgeTxnInfo.txnStatus = BridgeTxnStatus.DONE_INCOMING;
  await db.updateMintTxn(bridgeTxnInfo);

  // make outgoing txn
  bridgeTxnInfo.toAmountAtom = bridgeTxnInfo.getToAmountAtom();
  bridgeTxnInfo.txnStatus = BridgeTxnStatus.DOING_OUTGOING;
  await db.updateMintTxn(bridgeTxnInfo);

  const outgoingTxnId = await outgoingBlockchain.makeOutgoingTxn({
    fromAddr: ENV.ALGO_MASTER_ADDR,
    toAddr: bridgeTxnInfo.toAddr,
    atomAmount: bridgeTxnInfo.toAmountAtom,
    txnId: literal.UNUSED,
  });
  bridgeTxnInfo.txnStatus = BridgeTxnStatus.DOING_OUTGOING;
  bridgeTxnInfo.toTxnId = outgoingTxnId;
  await db.updateMintTxn(bridgeTxnInfo);
  await outgoingBlockchain.confirmTxn({
    fromAddr: ENV.ALGO_MASTER_ADDR,
    toAddr: bridgeTxnInfo.toAddr,
    atomAmount: bridgeTxnInfo.fromAmountAtom,
    txnId: outgoingTxnId,
  });

  // verify outgoing txn
  bridgeTxnInfo.txnStatus = BridgeTxnStatus.DONE_OUTGOING;
  await db.updateMintTxn(bridgeTxnInfo);
  // user confirmation via socket/email

  /* CLEAN UP */
  /* await  */ db.disconnect();

  return bridgeTxnInfo;
  // check indexer with hash
}
