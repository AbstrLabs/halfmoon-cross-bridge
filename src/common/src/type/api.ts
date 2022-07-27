export type { ApiAmount, ApiCallParam, CriticalApiCallParam };
export { fullyParseApiParam, parseCriticalApiCallParam, zTokenId };

import { TokenId } from './token';
import { parseWithZod } from '../../../utils/type/type';

/* API CALL PARAMS */

import { z } from 'zod';
import { TOKEN_TABLE } from '../../../bridge/token-table';
import { ERRORS } from '../../../utils/bridge-error';
import { zTokenId } from './txn';
import { Addr, ADDR_MAP, TxnId } from './blockchain';

type ApiAmount = z.infer<typeof zApiAmount>;
type CriticalApiCallParam = z.infer<typeof zCriticalApiCallParam>;

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

const zCriticalApiCallParam = z.object({
  to_token: zTokenId,
  from_token: zTokenId,
  txn_id: zTxnId,
});

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
  txn_id: zTxnId,
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

// new API Call Param, not in docs yet.
// removed "type", its unclear when we have more than one token.
// using snake_case instead of camelCase or spinal-case because youtube uses it.
// this interface is for displaying purpose only, we may not use it in the code.
// TODO: type ApiCallParam = z.infer<typeof zApiCallParam>;
interface ApiCallParam {
  amount: ApiAmount;
  txn_id: TxnId;
  from_addr: Addr;
  from_token: TokenId; // token_id
  to_addr: Addr;
  to_token: TokenId; // token_id
}

function fullyParseApiParam(apiParam: ApiCallParam): ApiCallParam {
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

function parseCriticalApiCallParam(
  criticalApiCallParam: CriticalApiCallParam
): CriticalApiCallParam {
  return parseWithZod(
    // TODO: ApiPostParam
    criticalApiCallParam,
    zCriticalApiCallParam,
    ERRORS.API.INVALID_API_PARAM
  );
}
