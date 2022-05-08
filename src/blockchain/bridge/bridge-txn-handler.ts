// TODO: 1. merge to BridgeTxn class
// TODO: 2. Check Asset ID!
// TODO: 3. Check if fromTxnId is reused

export { handleBridgeTxn as handleBridgeTxn };

import { Blockchain, ConfirmOutcome, TxnId, TxnType } from '..';
import { BlockchainName, BridgeTxnStatus } from '../..';
import { BridgeError, ERRORS } from '../../utils/errors';

import { BridgeTxn } from '.';
import { algoBlockchain } from '../algorand';
import { db } from '../../database/db';
import { literals } from '../../utils/literals';
import { logger } from '../../utils/logger';
import { nearBlockchain } from '../near';

async function handleBridgeTxn(bridgeTxn: BridgeTxn): Promise<BridgeTxn> {
  /* CONFIG */
  let incomingBlockchain: Blockchain;
  let outgoingBlockchain: Blockchain;

  let txnType;
  if (
    bridgeTxn.fromBlockchain === BlockchainName.NEAR &&
    bridgeTxn.toBlockchain === BlockchainName.ALGO
  ) {
    txnType = TxnType.MINT;
    incomingBlockchain = nearBlockchain;
    outgoingBlockchain = algoBlockchain;
  } else if (
    bridgeTxn.fromBlockchain === BlockchainName.ALGO &&
    bridgeTxn.toBlockchain === BlockchainName.NEAR
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
    literals.MAKING_TXN(
      txnType,
      bridgeTxn.fromAmountAtom,
      bridgeTxn.fromAddr,
      bridgeTxn.toAddr
    )
  );

  // TODO: move this to main.ts
  await db.connect();

  /* MAKE BRIDGE TRANSACTION */
  // update as sequence diagram

  // TODO: should move err-handling to db.
  try {
    bridgeTxn.dbId = await db.createTxn(bridgeTxn);
  } catch (e) {
    throw new BridgeError(ERRORS.EXTERNAL.DB_CREATE_TX_FAILED, {
      bridgeTxn,
    });
  }

  bridgeTxn.txnStatus = BridgeTxnStatus.DOING_INCOMING;
  await db.updateTxn(bridgeTxn);

  let confirmOutcome;
  try {
    confirmOutcome = await incomingBlockchain.confirmTxn({
      fromAddr: bridgeTxn.fromAddr,
      atomAmount: bridgeTxn.fromAmountAtom,
      toAddr: incomingBlockchain.centralizedAddr,
      txnId: bridgeTxn.fromTxnId,
    });
  } finally {
    switch (confirmOutcome) {
      case ConfirmOutcome.SUCCESS:
        break;
      case ConfirmOutcome.WRONG_INFO:
        bridgeTxn.txnStatus = BridgeTxnStatus.ERR_VERIFY_INCOMING;
        await db.updateTxn(bridgeTxn);
        break;
      case ConfirmOutcome.TIMEOUT:
        bridgeTxn.txnStatus = BridgeTxnStatus.ERR_TIMEOUT_INCOMING;
        await db.updateTxn(bridgeTxn);
        break;
    }
  }

  bridgeTxn.txnStatus = BridgeTxnStatus.DONE_INCOMING;
  await db.updateTxn(bridgeTxn);

  // make outgoing txn
  let outgoingTxnId: TxnId;
  bridgeTxn.toAmountAtom = bridgeTxn.getToAmountAtom();
  try {
    bridgeTxn.txnStatus = BridgeTxnStatus.DOING_OUTGOING;
    await db.updateTxn(bridgeTxn);
    outgoingTxnId = await outgoingBlockchain.makeOutgoingTxn({
      fromAddr: outgoingBlockchain.centralizedAddr,
      toAddr: bridgeTxn.toAddr,
      atomAmount: bridgeTxn.toAmountAtom,
      txnId: literals.UNUSED,
    });
    bridgeTxn.txnStatus = BridgeTxnStatus.DOING_OUTGOING;
    bridgeTxn.toTxnId = outgoingTxnId;
    await db.updateTxn(bridgeTxn);
  } catch {
    // TODO: same-piece-MAKE_OUTGOING_TX_FAILED
    bridgeTxn.txnStatus = BridgeTxnStatus.ERR_MAKE_OUTGOING;
    await db.updateTxn(bridgeTxn);
    throw new BridgeError(ERRORS.EXTERNAL.MAKE_OUTGOING_TX_FAILED, {
      bridgeTxn,
    });
  }
  if (outgoingTxnId === undefined) {
    // TODO: same-piece-MAKE_OUTGOING_TX_FAILED
    bridgeTxn.txnStatus = BridgeTxnStatus.ERR_MAKE_OUTGOING;
    await db.updateTxn(bridgeTxn);
    throw new BridgeError(ERRORS.EXTERNAL.MAKE_OUTGOING_TX_FAILED, {
      bridgeTxn,
    });
  }

  try {
    await outgoingBlockchain.confirmTxn({
      fromAddr: outgoingBlockchain.centralizedAddr,
      toAddr: bridgeTxn.toAddr,
      atomAmount: bridgeTxn.toAmountAtom,
      txnId: outgoingTxnId,
    });
  } catch {
    bridgeTxn.txnStatus = BridgeTxnStatus.ERR_CONFIRM_OUTGOING;
  }

  // verify outgoing txn
  bridgeTxn.txnStatus = BridgeTxnStatus.DONE_OUTGOING;
  await db.updateTxn(bridgeTxn);
  // user confirmation via socket/email

  /* CLEAN UP */
  /* await  */ db.disconnect();

  return bridgeTxn;
  // check indexer with hash
}
