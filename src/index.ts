export { type GenericTxInfo, BridgeTxStatus, BridgeTxInfo, BlockchainName };

interface GenericTxInfo {
  from: string;
  to: string;
  amount: string; // l10n. in some cases 1/2 written as 0,5
  txId: string;
}

interface BridgeTxInfo {
  dbId?: number;
  amount: bigint; // in "toTx"
  timestamp: bigint;
  fromAddr: string;
  fromBlockchain: BlockchainName;
  fromTxId: string;
  toAddr: string;
  toBlockchain: BlockchainName;
  toTxId?: string;
  txStatus: BridgeTxStatus;
}

enum BlockchainName {
  NEAR = 'NEAR',
  ALGO = 'ALGO',
}
enum BridgeTxStatus {
  NOT_STARTED = 'NOT_STARTED',
  ERR_SEVER_INTERNAL = 'ERR_SEVER_INTERNAL',
  ERR_AWS_RDS_DB = 'ERR_AWS_RDS_DB',
  DOING_RECEIVE = 'DOING_RECEIVE',
  ERR_VERIFY_INCOMING = 'ERR_VERIFY_INCOMING',
  ERR_TIMEOUT_INCOMING = 'ERR_TIMEOUT_INCOMING',
  DONE_RECEIVE = 'DONE_RECEIVE',
  ERR_MAKE_OUTGOING = 'ERR_MAKE_OUTGOING',
  DOING_SEND = 'DOING_SEND',
  ERR_TIMEOUT_OUTGOING = 'ERR_TIMEOUT_OUTGOING',
  DONE_SEND = 'DONE_SEND',
  BRIDGE_PROCESSED = 'BRIDGE_PROCESSED',
  BRIDGE_CONFIRMED = 'BRIDGE_CONFIRMED',
}
