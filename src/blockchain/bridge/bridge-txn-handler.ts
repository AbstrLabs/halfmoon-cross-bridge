export { bridge_txn_handler };
import { type Addr, type TxID, TxType, Blockchain } from '..';
import {
  BlockchainName,
  BridgeTxInfo,
  BridgeTxStatus,
  GenericTxInfo,
} from '../..';
import { db } from '../../database';
import { log } from '../../utils/logger';
import { algoBlockchain } from '../algorand';
import { nearBlockchain } from '../near';

async function bridge_txn_handler(
  genericTxInfo: GenericTxInfo,
  txType: TxType
): Promise<void> {
  /* CONFIG */
  let incomingBlockchain: Blockchain;
  let outgoingBlockchain: Blockchain;
  const { from, to, amount, txId: txId } = genericTxInfo;
  log(`Making ${txType} transaction of ${amount} from ${from} to ${to}`);
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
  const bridgeTx = genericInfoToBridgeTxInfo(
    genericTxInfo,
    txType,
    BigInt(Date.now())
  );
  const dbId = await db.createTx(bridgeTx);
  bridgeTx.dbId = dbId;

  // update as sequence diagram
  bridgeTx.txStatus = BridgeTxStatus.DOING_RECEIVE;
  await db.updateTx(bridgeTx);
  await incomingBlockchain.confirmTransaction({
    ...genericTxInfo,
    to: 'abstrlabs.testnet',
  });
  bridgeTx.txStatus = BridgeTxStatus.DONE_RECEIVE;
  await db.updateTx(bridgeTx);

  // empty slot, after confirming incoming tx, for error handling

  bridgeTx.txStatus = BridgeTxStatus.DOING_SEND;
  await db.updateTx(bridgeTx);
  await outgoingBlockchain.makeOutgoingTxn({
    ...genericTxInfo,
    from: 'JMJLRBZQSTS6ZINTD3LLSXCW46K44EI2YZHYKCPBGZP3FLITIQRGPELOBE',
  });
  // TODO: add a confirmation checkpoint in db
  await outgoingBlockchain.confirmTransaction({
    ...genericTxInfo,
    from: 'JMJLRBZQSTS6ZINTD3LLSXCW46K44EI2YZHYKCPBGZP3FLITIQRGPELOBE',
  });
  bridgeTx.txStatus = BridgeTxStatus.DONE_SEND;
  await db.updateTx(bridgeTx);

  // user confirmation via socket

  /* CLEAN UP */
  /* await  */ db.disconnect();

  return;
  // check indexer with hash
}

/* HELPER */
function genericInfoToBridgeTxInfo(
  genericTxInfo: GenericTxInfo,
  txType: TxType,
  timestamp: bigint
): BridgeTxInfo {
  const { from, to, amount, txId } = genericTxInfo;
  const atomicAmount = BigInt(amount) * BigInt(10) ** BigInt(10);
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
