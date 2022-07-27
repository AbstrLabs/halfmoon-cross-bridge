// TODO: ren to bridge
export type { TxnUid };
export {
  BridgeTxnSafeObj,
  BridgeTxnStatusEnum,
  parseTxnUid,
  zBridgeTxnStatus,
  zTokenId,
  zTxnUid,
};

import { z } from 'zod';
import { ERRORS } from '../../../utils/bridge-error';
import { parseWithZod } from '../../../utils/type/type';
import { parseTxnId } from './blockchain';
import { parseDbId } from './database';
import { TokenId } from './token';

// Class BridgeTxn
type TxnUid = z.infer<typeof zTxnUid>;

enum BridgeTxnStatusEnum {
  // By order
  NOT_CREATED = 'NOT_CREATED', //                   Only used in ram
  ERR_SEVER_INTERNAL = 'ERR_SEVER_INTERNAL', //     General server internal error
  ERR_AWS_RDS_DB = 'ERR_AWS_RDS_DB', //             General AWS DB External error
  DOING_INITIALIZE = 'DOING_INITIALIZE', //         BridgeTxn without calling initialize
  ERR_INITIALIZE = 'ERR_INITIALIZE', //             BridgeTxn initialize failed
  DONE_INITIALIZE = 'DONE_INITIALIZE', //           BridgeTxn after initialize
  DOING_INCOMING = 'DOING_INCOMING', //             Await confirm incoming
  ERR_VERIFY_INCOMING = 'ERR_VERIFY_INCOMING', //   Verified incoming is wrong
  ERR_TIMEOUT_INCOMING = 'ERR_TIMEOUT_INCOMING', // Confirm incoming timeout
  DONE_INCOMING = 'DONE_INCOMING', //               Confirm incoming success
  DOING_OUTGOING = 'DOING_OUTGOING', //             Await confirm outgoing txn
  ERR_MAKE_OUTGOING = 'ERR_MAKE_OUTGOING', //       Make outgoing txn failed
  DOING_VERIFY = 'DOING_VERIFY', //                 Await verify outgoing txn
  ERR_CONFIRM_OUTGOING = 'ERR_CONFIRM_OUTGOING', // Confirm outgoing timeout
  DONE_OUTGOING = 'DONE_OUTGOING', //               Confirm outgoing success
  USER_CONFIRMED = 'USER_CONFIRMED', //             User confirmed
}

interface BridgeTxnSafeObj {
  // TODO: move to zod
  // TODO: type better (addr,txnId)
  dbId: number | string;
  fixedFeeAtom: string;
  marginFeeAtom: string;
  createdTime: string;
  fromAddr: string;
  fromAmountAtom: string;
  fromTokenId: TokenId;
  fromTxnId: string;
  toAddr: string;
  toAmountAtom: string;
  toTokenId: TokenId;
  toTxnId?: string | null;
  txnStatus: BridgeTxnStatusEnum;
}
const zTokenId = z.nativeEnum(TokenId);

const zBridgeTxnStatus = z.nativeEnum(BridgeTxnStatusEnum);
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
