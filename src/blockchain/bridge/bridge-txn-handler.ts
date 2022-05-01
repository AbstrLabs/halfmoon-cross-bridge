export { bridge_txn_handler };

import { Blockchain, TxType } from '..';
import { type BridgeTxInfo, BlockchainName, BridgeTxStatus } from '../..';
import { BridgeError, ERRORS } from '../../utils/errors';

import { ENV } from '../../utils/dotenv';
import { algoBlockchain } from '../algorand';
import { db } from '../../database';
import { literal } from '../../utils/literal';
import { logger } from '../../utils/logger';
import { nearBlockchain } from '../near';

async function bridge_txn_handler(
  bridgeTxInfo: BridgeTxInfo
): Promise<BridgeTxInfo> {
  /* CONFIG */
  let incomingBlockchain: Blockchain;
  let outgoingBlockchain: Blockchain;
  let txType;
  const { fromAddr, toAddr, amount: atom } = bridgeTxInfo;
  if (
    bridgeTxInfo.fromBlockchain === BlockchainName.NEAR &&
    bridgeTxInfo.toBlockchain === BlockchainName.ALGO
  ) {
    txType = TxType.Mint;
    incomingBlockchain = nearBlockchain;
    outgoingBlockchain = algoBlockchain;
  } else if (
    bridgeTxInfo.fromBlockchain === BlockchainName.ALGO &&
    bridgeTxInfo.toBlockchain === BlockchainName.NEAR
  ) {
    txType = TxType.Burn;
    incomingBlockchain = algoBlockchain;
    outgoingBlockchain = nearBlockchain;
  } else {
    throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TX_TYPE, { txType: txType });
  }
  logger.info(literal.MAKING_TXN(txType, atom, fromAddr, toAddr));
  await db.connect();

  /* MAKE TRANSACTION */

  const dbId = await db.createTx(bridgeTxInfo);
  bridgeTxInfo.dbId = dbId;

  // update as sequence diagram
  bridgeTxInfo.txStatus = BridgeTxStatus.CONFIRM_INCOMING;
  await db.updateTx(bridgeTxInfo);
  await incomingBlockchain.confirmTxn({
    fromAddr: bridgeTxInfo.fromAddr,
    toAddr: ENV.NEAR_MASTER_ADDR,
    atom: bridgeTxInfo.amount,
    txId: bridgeTxInfo.fromTxId,
  });
  bridgeTxInfo.txStatus = BridgeTxStatus.DONE_INCOMING;
  await db.updateTx(bridgeTxInfo);

  // empty slot, after confirming incoming tx, for error handling
  // TODO: add txn fee calculation logic here.
  // TODO! important

  bridgeTxInfo.txStatus = BridgeTxStatus.MAKE_OUTGOING;
  await db.updateTx(bridgeTxInfo);
  const outgoingTxId = await outgoingBlockchain.makeOutgoingTxn({
    fromAddr: ENV.ALGO_MASTER_ADDR,
    toAddr: bridgeTxInfo.toAddr,
    atom: bridgeTxInfo.amount,
    txId: literal.UNUSED,
  });

  // verify outgoing tx
  bridgeTxInfo.toTxId = outgoingTxId;
  bridgeTxInfo.txStatus = BridgeTxStatus.VERIFY_OUTGOING;
  await db.updateTx(bridgeTxInfo);
  await outgoingBlockchain.confirmTxn({
    fromAddr: ENV.ALGO_MASTER_ADDR,
    toAddr: bridgeTxInfo.toAddr,
    atom: bridgeTxInfo.amount,
    txId: outgoingTxId,
  });
  bridgeTxInfo.txStatus = BridgeTxStatus.DONE_OUTGOING;
  await db.updateTx(bridgeTxInfo);

  // user confirmation via socket

  /* CLEAN UP */
  /* await  */ db.disconnect();

  return bridgeTxInfo;
  // check indexer with hash
}

/* HELPER */
// TODO: move to formatter
