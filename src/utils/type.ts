/** Zod parser (verifier) and the derived Typescript Types
 * All Zod related types should be here.
 */

// Use Zod.union instead of TS union

export {
  type Addr,
  type AlgoAddr,
  type AlgoAssetTransferTxnOutcome,
  type AlgoTxnId,
  type AlgoTxnParam,
  type ApiCallParam,
  type Biginter,
  type BurnApiParam,
  type DbId,
  type DbItem,
  type MintApiParam,
  type NearAddr,
  type NearTxnId,
  type NearTxnParam,
  type Stringer,
  type TxnId,
  type TxnParam,
  zDbItem,
  parseBurnApiParam,
  parseMintApiParam,
  parseDbItem,
  parseBigInt,
};

import { z } from 'zod';
import { BridgeTxnStatus } from '..';
import { BridgeError, ErrorTemplate, ERRORS } from './errors';

type Stringer = {
  toString(): string;
};

function parseWithZod<T>(
  zodShaped: T,
  zodParser: z.ZodType,
  errorTemplate: ErrorTemplate
): T {
  try {
    return zodParser.parse(zodShaped);
  } catch (err) {
    throw new BridgeError(errorTemplate, { parseErrorDetail: err });
  }
}

/* Zod to Typescript */
// Order of these is same as they are used in the txn process.
// Same order as below zTypeName part

// API -> server
type MintApiParam = z.infer<typeof zMintApiParam>;
type BurnApiParam = z.infer<typeof zBurnApiParam>;
type ApiCallParam = z.infer<typeof zApiCallParam>;

// blockchain specific
type AlgoAddr = z.infer<typeof zAlgoAddr>;
type NearAddr = z.infer<typeof zNearAddr>;
type Addr = z.infer<typeof zAddr>;
type NearTxnId = z.infer<typeof zNearTxnId>;
type AlgoTxnId = z.infer<typeof zAlgoTxnId>;
type TxnId = z.infer<typeof zTxnId>;
type AlgoTxnParam = z.infer<typeof zAlgoTxnParam>;
type NearTxnParam = z.infer<typeof zNearTxnParam>;
type TxnParam = z.infer<typeof zTxnParam>;
type AlgoAssetTransferTxnOutcome = z.infer<typeof zAlgoAssetTransferTxnOutcome>;
// Used by BridgeTxn Class - database
type DbItem = z.infer<typeof zDbItem>;
type DbId = z.infer<typeof zDbId>;
type Biginter = z.infer<typeof zBiginter>;

// API -> server
const zAlgoAddr = z
  // from https://forum.algorand.org/t/how-is-an-algorands-address-made/960 // no 0,1,8
  // also in algosdk repo has some fixed value of 58.
  .string()
  .regex(/^[2-79A-Z]{58}$/, 'malformed algorand address');
const zNearAddr = z
  // from https://wallet.testnet.near.org/create
  // cannot start with `-` and `_`
  .string()
  .regex(
    /^[0-9a-z][0-9a-z\-_]{1,64}.(testnet|mainnet)$/,
    'malformed near address'
  );
const zAddr = z.union([zAlgoAddr, zNearAddr]);

const zApiAmount = z
  .string()
  .regex(/^ *[0-9,]{1,}\.?[0-9]{0,10} *$/, 'malformed amount')
  .refine((str: string) => {
    const num = Number(str);
    if (isNaN(num)) {
      return false;
    }
    if (num < 1 || num > Number.MAX_SAFE_INTEGER) {
      return false;
    }
    return true;
  });

// TODO: unfinished zNearTxnId, zAlgoTxnId
const zNearTxnId = z.string().regex(/^.{0,64}$/); // max length is 64
const zAlgoTxnId = z.string().regex(/^.{0,64}$/); // max length is 64
const zTxnId = z.union([zAlgoTxnId, zNearTxnId]);
const zMintApiParam = z.object({
  amount: zApiAmount,
  from: zNearAddr,
  to: zAlgoAddr,
  txnId: zNearTxnId,
});
function parseMintApiParam(apiParam: MintApiParam): MintApiParam {
  return parseWithZod(apiParam, zMintApiParam, ERRORS.TXN.INVALID_API_PARAM);
}
const zBurnApiParam = z.object({
  amount: zApiAmount,
  from: zAlgoAddr,
  to: zNearAddr,
  txnId: zNearTxnId,
});
function parseBurnApiParam(apiParam: BurnApiParam): BurnApiParam {
  return parseWithZod(apiParam, zBurnApiParam, ERRORS.TXN.INVALID_API_PARAM);
}
const zApiCallParam = z.union([zMintApiParam, zBurnApiParam]);

// blockchain specific
const zAlgoTxnParam = z.object({
  atomAmount: z.bigint(),
  fromAddr: zAlgoAddr,
  toAddr: zAlgoAddr,
  txnId: zAlgoTxnId,
});
const zNearTxnParam = z.object({
  atomAmount: z.bigint(),
  fromAddr: zNearAddr,
  toAddr: zNearAddr,
  txnId: zNearTxnId,
});
const zTxnParam = z.union([zAlgoTxnParam, zNearTxnParam]);

const zBiginter =
  // can convert to bigint without loss of precision
  z.union([
    z.string().regex(/^[1-9][0-9]{0,18}$/),
    z.number().int(),
    z.bigint(),
  ]);

const zAlgoAssetTransferTxnOutcome = z.object({
  // from Indexer JSON response
  'current-round': z.number(),
  transaction: z.object({
    'asset-transfer-transaction': z.object({
      amount: zBiginter,
      'asset-id': z.number(),
      'close-amount': z.number(),
      receiver: zAlgoAddr,
    }),
    'close-rewards': zBiginter,
    'closing-amount': zBiginter,
    'confirmed-round': z.number(),
    fee: zBiginter,
    'first-valid': zBiginter,
    'genesis-hash': z.string(),
    'genesis-id': z.literal('testnet-v1.0'),
    id: zAlgoTxnId,
    'intra-round-offset': z.number(),
    'last-valid': z.number(),
    'receiver-rewards': z.number(),
    'round-time': z.number(),
    sender: zAlgoAddr,
    'sender-rewards': z.number(),
    signature: z.object({
      sig: z.string(),
    }),
    'tx-type': z.literal('axfer'),
  }),
});
// Used by BridgeTxn Class - Database

function parseBiginter(biginter: Biginter): Biginter {
  return parseWithZod(biginter, zBiginter, ERRORS.INTERNAL.TYPE_ERR_BIGINT);
}
function parseBigInt(biginter: Biginter): bigint {
  return BigInt(parseBiginter(biginter));
}
const zDbId = z.number().int().positive();
const zBridgeTxnStatus = z.nativeEnum(BridgeTxnStatus);
const zDbItem = z.object({
  db_id: zDbId,
  fixed_fee_atom: zBiginter,
  from_addr: zAddr,
  from_amount_atom: zBiginter,
  from_txn_id: zTxnId,
  margin_fee_atom: zBiginter,
  created_time: zBiginter,
  to_addr: zAddr,
  to_amount_atom: zBiginter,
  to_txn_id: zTxnId,
  txn_status: zBridgeTxnStatus,
});
function parseDbItem(dbItem: DbItem): DbItem {
  return parseWithZod(dbItem, zDbItem, ERRORS.EXTERNAL.INVALID_DB_ITEM);
}
