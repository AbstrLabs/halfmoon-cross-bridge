export { bridge_txn_handler };
import { type Addr, type TxID, TxType, Blockchain } from '..';
import {
  BlockchainName,
  BridgeTxInfo,
  BridgeTxStatus,
  GenericTxInfo,
} from '../..';
import { db } from '../../database';
import { goNearToAtom } from '../../utils/formatter';
import { logger } from '../../utils/logger';
import { algoBlockchain } from '../algorand';
import { nearBlockchain } from '../near';

async function bridge_txn_handler(
  genericTxInfo: GenericTxInfo,
  txType: TxType
): Promise<BridgeTxInfo> {
  /* CONFIG */
  let incomingBlockchain: Blockchain;
  let outgoingBlockchain: Blockchain;
  const { from, to, amount, txId: txId } = genericTxInfo;
  logger.info(
    `Making ${txType} transaction of ${amount} from ${from} to ${to}`
  );
  if (txType === TxType.Mint) {
    incomingBlockchain = nearBlockchain;
    outgoingBlockchain = algoBlockchain;
  } else if (txType === TxType.Burn) {
    incomingBlockchain = algoBlockchain;
    outgoingBlockchain = nearBlockchain;
  } else {
    throw new Error('Unknown txType');
  }
  await db.connect();

  /* MAKE TRANSACTION */
  const bridgeTxInfo = genericInfoToBridgeTxInfo(
    genericTxInfo,
    txType,
    BigInt(Date.now())
  );
  const dbId = await db.createTx(bridgeTxInfo);
  bridgeTxInfo.dbId = dbId;

  // update as sequence diagram
  bridgeTxInfo.txStatus = BridgeTxStatus.CONFIRM_INCOMING;
  await db.updateTx(bridgeTxInfo);
  await incomingBlockchain.confirmTxn({
    ...genericTxInfo,
    to: 'abstrlabs.testnet',
  });
  bridgeTxInfo.txStatus = BridgeTxStatus.DONE_INCOMING;
  await db.updateTx(bridgeTxInfo);

  // empty slot, after confirming incoming tx, for error handling
  // TODO: add txn fee.

  bridgeTxInfo.txStatus = BridgeTxStatus.MAKE_OUTGOING;
  await db.updateTx(bridgeTxInfo);
  const outgoingTxId = await outgoingBlockchain.makeOutgoingTxn({
    ...genericTxInfo,
    // TODO: use env
    from: 'JMJLRBZQSTS6ZINTD3LLSXCW46K44EI2YZHYKCPBGZP3FLITIQRGPELOBE',
  });
  bridgeTxInfo.toTxId = outgoingTxId;
  bridgeTxInfo.txStatus = BridgeTxStatus.VERIFY_OUTGOING;
  await db.updateTx(bridgeTxInfo);
  await outgoingBlockchain.confirmTxn({
    ...genericTxInfo,
    // TODO: use env
    txId: outgoingTxId,
    amount: goNearToAtom(genericTxInfo.amount),
    from: 'JMJLRBZQSTS6ZINTD3LLSXCW46K44EI2YZHYKCPBGZP3FLITIQRGPELOBE',
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
function genericInfoToBridgeTxInfo(
  genericTxInfo: GenericTxInfo,
  txType: TxType,
  timestamp: bigint
): BridgeTxInfo {
  const { from, to, amount, txId } = genericTxInfo;
  // TODO: BAN-15: amount should be parsed right after API call
  const atomicAmount = BigInt(goNearToAtom(amount));
  var fromBlockchain: BlockchainName, toBlockchain: BlockchainName;

  if (txType === TxType.Mint) {
    fromBlockchain = BlockchainName.NEAR;
    toBlockchain = BlockchainName.ALGO;
  } else if (txType === TxType.Burn) {
    fromBlockchain = BlockchainName.ALGO;
    toBlockchain = BlockchainName.NEAR;
  } else {
    throw new Error('Unknown txType');
  }

  const bridgeTxInfo: BridgeTxInfo = {
    dbId: undefined,
    amount: atomicAmount, // in "toTx"
    timestamp,
    fromAddr: from,
    fromBlockchain,
    fromTxId: txId,
    toAddr: to,
    toBlockchain,
    toTxId: undefined,
    txStatus: BridgeTxStatus.NOT_STARTED,
  };
  return bridgeTxInfo;
}
