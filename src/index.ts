export { type GenericTxInfo, BridgeTxStatus, BridgeTxInfo, BlockchainName };

interface GenericTxInfo {
  from: string;
  to: string;
  amount: string; // TODO: l10n. in some cases 1/2 written as 0,5
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
  // By order
  NOT_STARTED = 'NOT_STARTED',
  ERR_SEVER_INTERNAL = 'ERR_SEVER_INTERNAL',
  ERR_AWS_RDS_DB = 'ERR_AWS_RDS_DB',
  CONFIRM_INCOMING = 'CONFIRM_INCOMING',
  ERR_TIMEOUT_INCOMING = 'ERR_TIMEOUT_INCOMING',
  VERIFY_INCOMING = 'VERIFY_INCOMING',
  ERR_VERIFY_INCOMING = 'ERR_VERIFY_INCOMING',
  DONE_INCOMING = 'DONE_INCOMING',
  ERR_MAKE_OUTGOING = 'ERR_MAKE_OUTGOING',
  MAKE_OUTGOING = 'MAKE_OUTGOING',
  VERIFY_OUTGOING = 'VERIFY_OUTGOING',
  ERR_TIMEOUT_OUTGOING = 'ERR_TIMEOUT_OUTGOING',
  DONE_OUTGOING = 'DONE_OUTGOING',
  USER_CONFIRMED = 'USER_CONFIRMED',
}
