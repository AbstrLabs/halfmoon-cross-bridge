/** All Zod related types and their aliases */

export {
  type AlgoAddr,
  type AlgoTxnId,
  type AlgoTxnParam,
  type BurnApiParam,
  type MintApiParam,
  type NearAddr,
  type NearTxnId,
  type NearTxnParam,
  parseBurnApiParam,
  parseMintApiParam,
};
import { z } from 'zod';
import { BridgeError, ERRORS } from './errors';

type MintApiParam = z.infer<typeof zMintApiParam>;
type BurnApiParam = z.infer<typeof zBurnApiParam>;
type AlgoTxnParam = z.infer<typeof zAlgoTxnParam>;
type NearTxnParam = z.infer<typeof zNearTxnParam>;
type AlgoAddr = z.infer<typeof zAlgoAddr>;
type NearAddr = z.infer<typeof zNearAddr>;
type NearTxnId = z.infer<typeof zNearTxnId>;
type AlgoTxnId = z.infer<typeof zAlgoTxnId>;

export const zNearAddr = z
  // from https://wallet.testnet.near.org/create
  // cannot start with `-` and `_`
  .string()
  .regex(
    /^[0-9a-z][0-9a-z\-_]{1,64}.(testnet|mainnet)$/,
    'malformed near address'
  );
export const zAlgoAddr = z
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

export const zNearTxnId = z.string(); // TODO: unfinished
export const zAlgoTxnId = z.string(); // TODO: unfinished

export const zMintApiParam = z.object({
  amount: zApiAmount,
  from: zNearAddr,
  to: zAlgoAddr,
  txnId: zNearTxnId,
});
export const zBurnApiParam = z.object({
  amount: zApiAmount,
  from: zAlgoAddr,
  to: zNearAddr,
  txnId: zNearTxnId,
});

export const zAlgoTxnParam = z.object({
  atomAmount: z.bigint(),
  fromAddr: zAlgoAddr,
  toAddr: zAlgoAddr,
  txnId: zAlgoTxnId,
});
export const zNearTxnParam = z.object({
  atomAmount: z.bigint(),
  fromAddr: zNearAddr,
  toAddr: zNearAddr,
  txnId: zNearTxnId,
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
