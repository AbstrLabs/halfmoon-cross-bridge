export { type GenericTxInfo, BridgeTxStatus };
import { startServer } from './server';

startServer();

interface GenericTxInfo {
  from: string;
  to: string;
  amount: string; // i18n. in some cases 1/2 written as 0,5
  txId: string;
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
