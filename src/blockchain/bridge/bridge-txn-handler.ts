export { bridge_txn_handler };

import { Blockchain, TxnType } from '..';
import { type BridgeTxnInfo, BlockchainName, BridgeTxnStatus } from '../..';
import { BridgeError, ERRORS } from '../../utils/errors';

import { ENV } from '../../utils/dotenv';
import { algoBlockchain } from '../algorand';
import { db } from '../../database';
import { literal } from '../../utils/literal';
import { logger } from '../../utils/logger';
import { nearBlockchain } from '../near';

async function bridge_txn_handler(
  bridgeTxnInfo: BridgeTxnInfo
): Promise<BridgeTxnInfo> {
  /* CONFIG */
  let incomingBlockchain: Blockchain;
  let outgoingBlockchain: Blockchain;
  let txType;
  const { fromAddr, toAddr, atomAmount } = bridgeTxnInfo;
  if (
    bridgeTxnInfo.fromBlockchain === BlockchainName.NEAR &&
    bridgeTxnInfo.toBlockchain === BlockchainName.ALGO
  ) {
    txType = TxnType.Mint;
    incomingBlockchain = nearBlockchain;
    outgoingBlockchain = algoBlockchain;
  } else if (
    bridgeTxnInfo.fromBlockchain === BlockchainName.ALGO &&
    bridgeTxnInfo.toBlockchain === BlockchainName.NEAR
  ) {
    txType = TxnType.Burn;
    incomingBlockchain = algoBlockchain;
    outgoingBlockchain = nearBlockchain;
  } else {
    throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TX_TYPE, { txType: txType });
  }
  logger.info(literal.MAKING_TXN(txType, atomAmount, fromAddr, toAddr));
  await db.connect();

  /* MAKE TRANSACTION */

  const dbId = await db.createTxn(bridgeTxnInfo);
  bridgeTxnInfo.dbId = dbId;

  // update as sequence diagram
  bridgeTxnInfo.txStatus = BridgeTxnStatus.CONFIRM_INCOMING;
  await db.updateTxn(bridgeTxnInfo);
  await incomingBlockchain.confirmTxn({
    fromAddr: bridgeTxnInfo.fromAddr,
    toAddr: ENV.NEAR_MASTER_ADDR,
    atomAmount: bridgeTxnInfo.atomAmount,
    txId: bridgeTxnInfo.fromTxnId,
  });
  bridgeTxnInfo.txStatus = BridgeTxnStatus.DONE_INCOMING;
  await db.updateTxn(bridgeTxnInfo);

  // empty slot, after confirming incoming tx, for error handling
  // TODO: add txn fee calculation logic here.
  // TODO! important

  bridgeTxnInfo.txStatus = BridgeTxnStatus.MAKE_OUTGOING;
  await db.updateTxn(bridgeTxnInfo);
  const outgoingTxnId = await outgoingBlockchain.makeOutgoingTxn({
    fromAddr: ENV.ALGO_MASTER_ADDR,
    toAddr: bridgeTxnInfo.toAddr,
    atomAmount: bridgeTxnInfo.atomAmount,
    txId: literal.UNUSED,
  });

  // verify outgoing tx
  bridgeTxnInfo.toTxnId = outgoingTxnId;
  bridgeTxnInfo.txStatus = BridgeTxnStatus.VERIFY_OUTGOING;
  await db.updateTxn(bridgeTxnInfo);
  await outgoingBlockchain.confirmTxn({
    fromAddr: ENV.ALGO_MASTER_ADDR,
    toAddr: bridgeTxnInfo.toAddr,
    atomAmount: bridgeTxnInfo.atomAmount,
    txId: outgoingTxnId,
  });
  bridgeTxnInfo.txStatus = BridgeTxnStatus.DONE_OUTGOING;
  await db.updateTxn(bridgeTxnInfo);

  // user confirmation via socket

  /* CLEAN UP */
  /* await  */ db.disconnect();

  return bridgeTxnInfo;
  // check indexer with hash
}

/* HELPER */
// TODO: move to formatter
