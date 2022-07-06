/**
 * Zod parser (verifier) and the derived Typescript Types
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
  type TxnUid,
  parseApiCallParam,
  parseBigInt,
  parseBurnApiParam,
  parseDbId,
  parseDbItem,
  parseMintApiParam,
  parseTxnId,
  parseTxnUid,
};

import { z } from 'zod';
import { BridgeTxnStatusEnum } from '..';
import { TxnType } from '../blockchain';
import { BridgeError, ErrorTemplate, ERRORS } from './errors';
import { logger } from './logger';

/* NON-ZOD TYPES */

interface Stringer {
  toString(): string;
}

/* ZOD TYPES (WITH PARSER) */

/**
 * Parses the given object with the given Zod schema.
 * If the parsing fails, throws a {@link BridgeError} with the given {@link ErrorTemplate}.
 *
 * @param  {T} zodShaped
 * @param  {z.ZodType} zodParser
 * @param  {ErrorTemplate} errorTemplate
 * @returns T
 */
function parseWithZod<T>(
  zodShaped: T,
  zodParser: z.ZodType,
  errorTemplate: ErrorTemplate
): T {
  if (typeof zodShaped === 'bigint') {
    logger.silly(`[ZOD]: parsingDbItem: ${zodShaped.toString()}`);
  } else {
    logger.silly(`[ZOD]: parsingDbItem: ${JSON.stringify(zodShaped)}`);
  }
  try {
    return zodParser.parse(zodShaped) as T;
  } catch (err) {
    logger.error(err);
    throw new BridgeError(errorTemplate, {
      parsing: zodShaped,
      parseErrorDetail: err,
    });
  }
}

/* Zod to Typescript */
// Order of these is same as they are used in the txn process.
// Same order as below zTypeName part

// API call param
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
// Class BridgeTxn
type TxnUid = z.infer<typeof zTxnUid>;
// Database
type DbItem = z.infer<typeof zDbItem>;
type DbId = z.infer<typeof zDbId>;
type Biginter = z.infer<typeof zBiginter>;

/* COMMONLY USED */

const zBiginter =
  // can convert to bigint without loss of precision
  z.union([
    z.string().regex(/^[1-9][0-9]{0,18}$/),
    // TODO: actually should remove "0" because minting/ burning 0 makes no sense
    z.literal('0'),
    z.number().int(),
    z.bigint(),
  ]);

/* API CALL PARAMS */

// from <https://forum.algorand.org/t/how-is-an-algorands-address-made/960> // no 0,1,8
// TODO: algosdk.isValidAddress(addr)
const zAlgoAddr = z
  // also in algosdk repo has some fixed value of 58.
  .string()
  .regex(/^[2-79A-Z]{58}$/, 'malformed algorand address');

// from <https://wallet.testnet.near.org/create>
const zNearAddr = z
  // cannot start with `-` and `_`
  .string()
  .regex(
    /^[0-9a-z][0-9a-z\-_]{2,64}.(testnet|mainnet)$/,
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

// TODO: unfinished zNearTxnId, zAlgoTxnId, copy from frontend code
const zNearTxnId = z.string().regex(/^.{0,64}$/); // max length is 64
const zAlgoTxnId = z.string().regex(/^.{0,64}$/); // max length is 64
const zTxnId = z.union([zAlgoTxnId, zNearTxnId]);
const zMintApiParam = z.object({
  type: z.literal(TxnType.MINT),
  amount: zApiAmount,
  from: zNearAddr,
  to: zAlgoAddr,
  txnId: zNearTxnId,
});

const zBurnApiParam = z.object({
  type: z.literal(TxnType.BURN),
  amount: zApiAmount,
  from: zAlgoAddr,
  to: zNearAddr,
  txnId: zNearTxnId,
});
const zApiCallParam = z.union([zMintApiParam, zBurnApiParam]);

/* BLOCKCHAIN SPECIFIC */

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

/* Class BridgeTxn */

const zBridgeTxnStatus = z.nativeEnum(BridgeTxnStatusEnum);
const zBridgeTxnType = z.nativeEnum(TxnType);
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

/* DATABASE */

const zDbId = z.number().int().positive();

// TODO: type more clearly on mint/burn like type:burn->from:algoAddr, to:nearAddr
const zDbItem = z.object({
  db_id: zDbId,
  txn_status: zBridgeTxnStatus,
  from_addr: zAddr,
  from_amount_atom: zBiginter,
  from_token_id: z.number(), // set range from enum?
  from_txn_id: zTxnId,
  to_addr: zAddr,
  to_amount_atom: zBiginter,
  to_token_id: z.number(), // set range from enum?
  to_txn_id: z.union([zTxnId, z.undefined(), z.null()]),
  txn_type: zBridgeTxnType,
  comments: z.string(),
  created_time: zBiginter,
  fixed_fee_atom: zBiginter,
  margin_fee_atom: zBiginter,
});

/* PARSER */

function parseMintApiParam(apiParam: MintApiParam): MintApiParam {
  return parseWithZod(apiParam, zMintApiParam, ERRORS.API.INVALID_API_PARAM);
}
function parseBurnApiParam(apiParam: BurnApiParam): BurnApiParam {
  return parseWithZod(apiParam, zBurnApiParam, ERRORS.API.INVALID_API_PARAM);
}
function parseApiCallParam(apiParam: ApiCallParam): ApiCallParam {
  return parseWithZod(apiParam, zApiCallParam, ERRORS.API.INVALID_API_PARAM);
}
function parseDbItem(dbItem: DbItem): DbItem {
  return parseWithZod(dbItem, zDbItem, ERRORS.INTERNAL.TYPE_PARSING_ERROR);
}
function parseBiginter(biginter: Biginter): Biginter {
  return parseWithZod(biginter, zBiginter, ERRORS.INTERNAL.TYPE_ERR_BIGINT);
}
function parseBigInt(biginter: Biginter): bigint {
  return BigInt(parseBiginter(biginter));
}
function parseDbId(dbId: DbId): DbId {
  return parseWithZod(dbId, zDbId, ERRORS.INTERNAL.TYPE_PARSING_ERROR);
}
function parseTxnId(txnId: TxnId): TxnId {
  return parseWithZod(txnId, zTxnId, ERRORS.INTERNAL.TYPE_PARSING_ERROR);
}
function parseTxnUid(txnUid: TxnUid): TxnUid {
  return parseWithZod(txnUid, zTxnUid, ERRORS.INTERNAL.TYPE_PARSING_ERROR);
}
