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
  type DbId,
  type DbItem,
  type NearAddr,
  type NearTxnId,
  type NewApiCallParam,
  type NearTxnParam,
  type Stringer,
  type TxnId,
  type TxnParam,
  type TxnUid,
  parseAlgoAddr,
  parseBigInt,
  parseDbId,
  parseDbItem,
  parseTxnId,
  parseTxnUid,
  fullyParseApiParam,
};

import { z } from 'zod';
import { BridgeTxnStatusEnum } from '..';
import { TxnType } from '../blockchain';
import { TokenId, TOKEN_TABLE } from '../bridge/token-table';
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
 * @returns {T} - same zodShaped
 */
function parseWithZod<T extends z.infer<U>, U extends z.ZodType>(
  zodShaped: T,
  zodParser: U,
  errorTemplate: ErrorTemplate
): T {
  if (typeof zodShaped === 'bigint') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/restrict-template-expressions
    logger.silly(`[ZOD]: parsingDbItem: ${zodShaped.toString()}`);
  } else {
    logger.silly(`[ZOD]: parsingDbItem: ${JSON.stringify(zodShaped)}`);
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiCallParam = NewApiCallParam; // TODO: Zod z.infer<typeof zApiCallParam>;
type ApiAmount = z.infer<typeof zApiAmount>;
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

const ADDR_MAP = {
  ALGO: zAlgoAddr,
  NEAR: zNearAddr,
};

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

// new API Call Param, not in docs yet.
// removed "type", its unclear when we have more than one token.
// using snake_case instead of camelCase or spinal-case because youtube uses it.
// this interface is for displaying purpose only, we may not use it in the code.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface NewApiCallParam {
  amount: ApiAmount;
  txn_id: TxnId;
  from_addr: Addr;
  from_token: TokenId; // token_id
  to_addr: Addr;
  to_token: TokenId; // token_id
}
// here from_token and from_addr should be from the same blockchain. so is (to_token and to_addr)
// token = [from_id, to_token] (array) seems acceptable, but the order is too important for us.

// this is for zod next version, and outdated.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const zTokenIdAddrPair = z.discriminatedUnion('token_id', [
  z.object({
    token_id: z.literal(TOKEN_TABLE.goNEAR.tokenId),
    addr: ADDR_MAP[TOKEN_TABLE.goNEAR.implBlockchain],
  }),
  z.object({
    token_id: z.literal(TOKEN_TABLE.wALGO.tokenId),
    addr: ADDR_MAP[TOKEN_TABLE.wALGO.implBlockchain],
  }),

  // Can't use next line due to https://github.com/colinhacks/zod/issues/1145
  // Object.keys(TOKEN_TABLE).map((id: TokenId) => z.literal(id))
  /* This won't work 
  Object.entries(TOKEN_TABLE).map(
  ([id, token]) =>
    z.object({
      token_id: z.literal(id),
      addr: ADDR_MAP[token.implBlockchain],
    })
  ) */
]);

const zApiParamBase = z.object({
  amount: zApiAmount,
  txn_id: zNearTxnId,
});

// from pair and to pair should have the same structure but different prop names.
// It's not supported by Zod, so we doing it twice
// better use zTokenIdAddrPair for the next two ZodTypes. Currently not supported by Zod.
const zApiFromPair = z.discriminatedUnion('from_token', [
  z.object({
    from_token: z.literal(TOKEN_TABLE.ALGO.tokenId),
    from_addr: ADDR_MAP[TOKEN_TABLE.ALGO.implBlockchain],
  }),
  z.object({
    from_token: z.literal(TOKEN_TABLE.NEAR.tokenId),
    from_addr: ADDR_MAP[TOKEN_TABLE.NEAR.implBlockchain],
  }),
  z.object({
    from_token: z.literal(TOKEN_TABLE.goNEAR.tokenId),
    from_addr: ADDR_MAP[TOKEN_TABLE.goNEAR.implBlockchain],
  }),
  z.object({
    from_token: z.literal(TOKEN_TABLE.wALGO.tokenId),
    from_addr: ADDR_MAP[TOKEN_TABLE.wALGO.implBlockchain],
  }),
]);

const zApiToPair = z.discriminatedUnion('to_token', [
  z.object({
    to_token: z.literal(TOKEN_TABLE.ALGO.tokenId),
    to_addr: ADDR_MAP[TOKEN_TABLE.ALGO.implBlockchain],
  }),
  z.object({
    to_token: z.literal(TOKEN_TABLE.NEAR.tokenId),
    to_addr: ADDR_MAP[TOKEN_TABLE.NEAR.implBlockchain],
  }),
  z.object({
    to_token: z.literal(TOKEN_TABLE.goNEAR.tokenId),
    to_addr: ADDR_MAP[TOKEN_TABLE.goNEAR.implBlockchain],
  }),
  z.object({
    to_token: z.literal(TOKEN_TABLE.wALGO.tokenId),
    to_addr: ADDR_MAP[TOKEN_TABLE.wALGO.implBlockchain],
  }),
]);

function fullyParseApiParam(apiParam: NewApiCallParam): NewApiCallParam {
  const { amount, txn_id, from_addr, from_token, to_addr, to_token } = apiParam;
  const fromPair = {
    from_token,
    from_addr,
  };
  const toPair = {
    to_token,
    to_addr,
  };
  const apiParamBase = {
    amount,
    txn_id,
  };
  parseWithZod(fromPair, zApiFromPair, ERRORS.API.INVALID_API_PARAM);
  parseWithZod(toPair, zApiToPair, ERRORS.API.INVALID_API_PARAM);
  parseWithZod(apiParamBase, zApiParamBase, ERRORS.API.INVALID_API_PARAM);
  return apiParam;
}
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
const zTokenId = z.nativeEnum(TokenId);

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
  txn_type: zBridgeTxnType,
  comments: z.string(),
  created_time: zBiginter,
  fixed_fee_atom: zBiginter,
  margin_fee_atom: zBiginter,
});

/* PARSER */

function parseAlgoAddr(algoAddr: AlgoAddr): AlgoAddr {
  return parseWithZod(algoAddr, zAlgoAddr, ERRORS.API.INVALID_API_PARAM);
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
