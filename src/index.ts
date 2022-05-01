export { type BridgeTxnInfo, BridgeTxnStatus, BlockchainName };
export {
  type AlgoTxnParam,
  type ApiCallParam,
  type BurnApiParam,
  type MintApiParam,
  type NearTxnParam,
  type TxnParam,
} from './utils/formatter';

interface BridgeTxnInfo {
  dbId?: number;
  atomAmount: bigint;
  timestamp: bigint;
  fromAddr: string;
  fromBlockchain: BlockchainName;
  fromTxnId: string;
  toAddr: string;
  toBlockchain: BlockchainName;
  toTxnId?: string;
  txStatus: BridgeTxnStatus;
}

enum BlockchainName {
  NEAR = 'NEAR',
  ALGO = 'ALGO',
}
enum BridgeTxnStatus {
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
  MAKE_OUTGOING = 'MAKE_OUTGOING', // should still use doing, done...
  VERIFY_OUTGOING = 'VERIFY_OUTGOING', // should still use doing, done...
  ERR_TIMEOUT_OUTGOING = 'ERR_TIMEOUT_OUTGOING',
  DONE_OUTGOING = 'DONE_OUTGOING',
  USER_CONFIRMED = 'USER_CONFIRMED',
}
