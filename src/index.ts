export { type GenericTxInfo, BridgeTxStatus };
import { startServer } from './server';

startServer();

interface GenericTxInfo {
  from: string;
  to: string;
  amount: string; // i18n. in some cases 1/2 = 0,5
  txId: string;
}

enum BridgeTxStatus {
  NOT_STARTED = 'NOT_STARTED',
  ERR_SEVER_INTERNAL = 'ERR_SEVER_INTERNAL',
  ERR_AWS_RDS_DB = 'ERR_AWS_RDS_DB',
  DOING_RECEIVE = 'DOING_RECEIVE',
  ERR_VERIFY_RECEIVING = 'ERR_VERIFY_RECEIVING',
  ERR_TIMEOUT_RECEIVING = 'ERR_TIMEOUT_RECEIVING',
  DONE_RECEIVE = 'DONE_RECEIVE',
  ERR_MAKE_SENDING = 'ERR_MAKE_SENDING',
  DOING_SEND = 'DOING_SEND',
  ERR_TIMEOUT_SENDING = 'ERR_TIMEOUT_SENDING',
  DONE_SEND = 'DONE_SEND',
  BRIDGE_PROCESSED = 'BRIDGE_PROCESSED',
  BRIDGE_CONFIRMED = 'BRIDGE_CONFIRMED',
}
