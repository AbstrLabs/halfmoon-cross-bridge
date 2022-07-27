export type { TxnUid };
export { parseTxnUid };

import { z } from 'zod';
import { ERRORS } from '../../../utils/bridge-error';
import { parseTxnId } from './blockchain';
import { parseDbId } from './database';
import { parseWithZod } from './zod-basic';

type TxnUid = z.infer<typeof zTxnUid>;

const zTxnUid = z.string().refine((str: string) => {
  const splitted = str.split('.');
  if (splitted.length !== 2) {
    return false;
  }
  const [dbId, txnId] = splitted;
  try {
    parseDbId(+dbId);
    parseTxnId(txnId);
  } catch (e) {
    return false;
  }
  return true;
});

function parseTxnUid(txnUid: TxnUid): TxnUid {
  return parseWithZod(txnUid, zTxnUid, ERRORS.INTERNAL.TYPE_PARSING_ERROR);
}
