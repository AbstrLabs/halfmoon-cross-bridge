export { bridge_txn_handler };

import { Blockchain, TxType } from '..';
import {
  type BridgeTxInfo,
  type TxParam,
  BlockchainName,
  BridgeTxStatus,
} from '../..';
import { BridgeError, ERRORS } from '../../utils/errors';

import { ENV } from '../../utils/dotenv';
import { algoBlockchain } from '../algorand';
import { db } from '../../database';
import { literal } from '../../utils/literal';
import { logger } from '../../utils/logger';
import { nearBlockchain } from '../near';
import { apiParamToBridgeTxInfo } from '../../utils/formatter';

async function bridge_txn_handler(
  txParam: TxParam,
  txType: TxType
): Promise<BridgeTxInfo> {
  /* CONFIG */
  let incomingBlockchain: Blockchain;
  let outgoingBlockchain: Blockchain;
  const { fromAddr, toAddr, atom, txId } = txParam;
  logger.info(literal.MAKING_TXN(txType, atom, fromAddr, toAddr));
  if (txType === TxType.Mint) {
    incomingBlockchain = nearBlockchain;
    outgoingBlockchain = algoBlockchain;
  } else if (txType === TxType.Burn) {
    incomingBlockchain = algoBlockchain;
    outgoingBlockchain = nearBlockchain;
  } else {
    throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TX_TYPE, { txType: txType });
  }
  await db.connect();

  /* MAKE TRANSACTION */
  const bridgeTxInfo = apiParamToBridgeTxInfo(
    txParam,
    txType,
    BigInt(Date.now())
  );
  const dbId = await db.createTx(bridgeTxInfo);
  bridgeTxInfo.dbId = dbId;

  // update as sequence diagram
  bridgeTxInfo.txStatus = BridgeTxStatus.CONFIRM_INCOMING;
  await db.updateTx(bridgeTxInfo);
  await incomingBlockchain.confirmTxn({
    ...txParam,
    toAddr: ENV.NEAR_MASTER_ADDR,
  });
  bridgeTxInfo.txStatus = BridgeTxStatus.DONE_INCOMING;
  await db.updateTx(bridgeTxInfo);

  // empty slot, after confirming incoming tx, for error handling
  // TODO: add txn fee calculation logic here.
  // TODO! important

  bridgeTxInfo.txStatus = BridgeTxStatus.MAKE_OUTGOING;
  await db.updateTx(bridgeTxInfo);
  const outgoingTxId = await outgoingBlockchain.makeOutgoingTxn({
    ...txParam,
    fromAddr: ENV.ALGO_MASTER_ADDR,
  });

  // verify outgoing tx
  bridgeTxInfo.toTxId = outgoingTxId;
  bridgeTxInfo.txStatus = BridgeTxStatus.VERIFY_OUTGOING;
  await db.updateTx(bridgeTxInfo);
  await outgoingBlockchain.confirmTxn({
    ...txParam,
    txId: outgoingTxId,
    fromAddr: ENV.ALGO_MASTER_ADDR,
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
