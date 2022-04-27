import { blob } from 'stream/consumers';
import { BlockchainName, BridgeTxStatus, type BridgeTxInfo } from '..';

export { dbItemToBridgeTxInfo };

const dbItemToBridgeTxInfo = (
  dbItem: any,
  extra: {
    fromBlockchain: BlockchainName;
    toBlockchain: BlockchainName;
  }
): BridgeTxInfo => {
  const bridgeTx: BridgeTxInfo = {
    amount: BigInt(dbItem.amount),
    dbId: dbItem.id,
    fromAddr: dbItem.near_address,
    fromBlockchain: extra.fromBlockchain,
    fromTxId: dbItem.near_tx_hash,
    timestamp: BigInt(dbItem.create_time),
    toAddr: dbItem.algorand_address,
    toBlockchain: extra.toBlockchain,
    toTxId: dbItem.algo_txn_id,
    txStatus: dbItem.request_status,
  };
  return bridgeTx;
};
