/** All Zod related types and their aliases */

// TODO: 1, use same parse func for parseBurnApiParam parseMintApiParam ...
// TODO: 1. like parse(Parser, BridgeError)
// TODO: 2. Move types that need parse from src/index
// TODO: 2.1. DbItem,Addr Collision

export {
  type Addr,
  type ApiCallParam,
  type AlgoAddr,
  type AlgoTxnId,
  type AlgoTxnParam,
  type BurnApiParam,
  type DbItem,
  type MintApiParam,
  type NearAddr,
  type NearTxnId,
  type NearTxnParam,
  type Stringer,
  zDbItem,
  parseBurnApiParam,
  parseMintApiParam,
};
import { z } from 'zod';
import { BridgeTxnStatus } from '..';
import { BridgeError, ERRORS } from './errors';

type Stringer = {
  toString(): string;
};

type MintApiParam = z.infer<typeof zMintApiParam>;
type BurnApiParam = z.infer<typeof zBurnApiParam>;
type ApiCallParam = z.infer<typeof zApiCallParam>;

type AlgoTxnParam = z.infer<typeof zAlgoTxnParam>;
type NearTxnParam = z.infer<typeof zNearTxnParam>;

type AlgoAddr = z.infer<typeof zAlgoAddr>;
type NearAddr = z.infer<typeof zNearAddr>;
type Addr = z.infer<typeof zAddr>;
type NearTxnId = z.infer<typeof zNearTxnId>;
type AlgoTxnId = z.infer<typeof zAlgoTxnId>;

type DbItem = z.infer<typeof zDbItem>;

const zNearAddr = z
  // from https://wallet.testnet.near.org/create
  // cannot start with `-` and `_`
  .string()
  .regex(
    /^[0-9a-z][0-9a-z\-_]{1,64}.(testnet|mainnet)$/,
    'malformed near address'
  );

const zAlgoAddr = z
  // from https://forum.algorand.org/t/how-is-an-algorands-address-made/960 // no 0,1,8
  .string()
  .regex(/^[2-79A-Z]{58}$/, 'malformed algorand address');

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

const zAddr = z.union([zAlgoAddr, zNearAddr]);

const zNearTxnId = z.string(); // TODO: unfinished
const zAlgoTxnId = z.string(); // TODO: unfinished
const zTxnId = z.union([zAlgoTxnId, zNearTxnId]);
const zMintApiParam = z.object({
  amount: zApiAmount,
  from: zNearAddr,
  to: zAlgoAddr,
  txnId: zNearTxnId,
});
const zBurnApiParam = z.object({
  amount: zApiAmount,
  from: zAlgoAddr,
  to: zNearAddr,
  txnId: zNearTxnId,
});
const zApiCallParam = z.union([zMintApiParam, zBurnApiParam]);

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

const zDbId = z.number().int().positive();
const zBiginter = z.string().regex(/^[1-9][0-9]{0,18}$/);
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

function parseMintApiParam(apiParam: MintApiParam): MintApiParam {
  try {
    return zMintApiParam.parse(apiParam);
  } catch (e) {
    throw new BridgeError(ERRORS.TXN.INVALID_API_PARAM, {
      parseErrorDetail: e,
    });
  }
}

function parseBurnApiParam(apiParam: BurnApiParam): BurnApiParam {
  try {
    return zBurnApiParam.parse(apiParam);
  } catch (e) {
    throw new BridgeError(ERRORS.TXN.INVALID_API_PARAM, {
      parseErrorDetail: e,
    });
  }
}
