export {
  BlockchainName,
  BridgeTxnStatus,
  type ApiCallParam,
  type BridgeTxnInfo,
  type BurnApiParam,
  type MintApiParam,
};

import { type BurnApiParam, type MintApiParam } from './utils/formatter';

type ApiCallParam = MintApiParam | BurnApiParam;

interface BridgeTxnInfo {
  dbId?: number;
  fixedFeeAtom: bigint;
  marginFeeAtom: bigint;
  timestamp: bigint;
  fromAddr: string;
  fromAmountAtom: bigint;
  fromBlockchain: BlockchainName;
  fromTxnId: string;
  toAddr: string;
  toAmountAtom: bigint;
  toBlockchain: BlockchainName;
  toTxnId?: string;
  txnStatus: BridgeTxnStatus;
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
