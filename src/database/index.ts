export { type DbItem };

import { Addr, TxnId } from '../blockchain';
import { BigIntStr, DbId } from './db';

import { BridgeTxnStatus } from '..';

interface DbItem {
  db_id: DbId;
  fixed_fee_atom: BigIntStr;
  from_addr: Addr;
  from_amount_atom: BigIntStr;
  from_txn_id: TxnId;
  margin_fee_atom: BigIntStr;
  created_time: BigIntStr;
  to_addr: Addr;
  to_amount_atom: BigIntStr;
  to_txn_id: TxnId;
  txn_status: BridgeTxnStatus;
}
