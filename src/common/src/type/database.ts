export type { DbItem, DbId };
export { parseDbItem, parseDbId };
/* DATABASE */

import { z } from 'zod';
import { ERRORS } from '../../../utils/bridge-error';
import { zBiginter, parseWithZod } from './zod-basic';
import { zAddr, zTxnId } from './blockchain';
import { zBridgeTxnStatus, zTokenId } from './txn';

// Database
type DbItem = z.infer<typeof zDbItem>;
type DbId = z.infer<typeof zDbId>;

const zDbId = z.number().int().positive();

// TODO: type more clearly on mint/burn like type:burn->from:algoAddr, to:nearAddr
const zDbItem = z.object({
  db_id: zDbId,
  txn_status: zBridgeTxnStatus,
  from_addr: zAddr,
  from_amount_atom: zBiginter,
  from_token_id: zTokenId,
  from_txn_id: zTxnId,
  to_addr: zAddr,
  to_amount_atom: zBiginter,
  to_token_id: zTokenId,
  to_txn_id: z.union([zTxnId, z.undefined(), z.null()]),
  txn_comment: z.union([z.string(), z.null(), z.undefined()]),
  created_time: zBiginter,
  fixed_fee_atom: zBiginter,
  margin_fee_atom: zBiginter,
});

function parseDbItem(dbItem: DbItem): DbItem {
  return parseWithZod(dbItem, zDbItem, ERRORS.INTERNAL.TYPE_PARSING_ERROR);
}
function parseDbId(dbId: DbId): DbId {
  return parseWithZod(dbId, zDbId, ERRORS.INTERNAL.TYPE_PARSING_ERROR);
}
