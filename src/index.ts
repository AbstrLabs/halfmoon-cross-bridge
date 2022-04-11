export { type GenericTxInfo };
import { startServer } from './server';

startServer();

interface GenericTxInfo {
  from: string;
  to: string;
  amount: string; // i18n. in some cases 1/2 = 0,5
  txId: string;
}
