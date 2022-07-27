export type {
  Addr,
  AlgoAddr,
  AlgoAssetTransferTxnOutcome,
  AlgoTxnId,
  AlgoTxnParam,
  NearAddr,
  NearTxnId,
  NearTxnParam,
  TxnId,
  TxnParam,
};
export { ADDR_MAP, zAddr, zTxnId, parseAlgoAddr, parseTxnId };
import { z } from 'zod';
import { ERRORS } from '../../../utils/bridge-error';
import { parseWithZod, zBiginter } from '../../../utils/type/type';

// Zod -> TS
type AlgoAddr = z.infer<typeof zAlgoAddr>;
type NearAddr = z.infer<typeof zNearAddr>;
type Addr = z.infer<typeof zAddr>;
type AlgoTxnParam = z.infer<typeof zAlgoTxnParam>;
type NearTxnParam = z.infer<typeof zNearTxnParam>;
type TxnParam = z.infer<typeof zTxnParam>;
type AlgoAssetTransferTxnOutcome = z.infer<typeof zAlgoAssetTransferTxnOutcome>;
// blockchain specific

type NearTxnId = z.infer<typeof zNearTxnId>;
type AlgoTxnId = z.infer<typeof zAlgoTxnId>;
type TxnId = z.infer<typeof zTxnId>;

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

// TODO: unfinished zNearTxnId, zAlgoTxnId, copy from frontend code
const zNearTxnId = z.string().regex(/^.{0,64}$/); // max length is 64
const zAlgoTxnId = z.string().regex(/^.{0,64}$/); // max length is 64
const zTxnId = z.union([zAlgoTxnId, zNearTxnId]);

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

/* PARSER */

function parseAlgoAddr(algoAddr: AlgoAddr): AlgoAddr {
  return parseWithZod(algoAddr, zAlgoAddr, ERRORS.API.INVALID_API_PARAM);
}
function parseTxnId(txnId: TxnId): TxnId {
  return parseWithZod(txnId, zTxnId, ERRORS.INTERNAL.TYPE_PARSING_ERROR);
}
