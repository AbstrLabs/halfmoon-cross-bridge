//TODO: separate to type file.

export {
  type AlgoAddr,
  type AlgoTxnId,
  type AlgoTxnParam,
  type BurnApiParam,
  type MintApiParam,
  type NearAddr,
  type NearTxnId,
  type NearTxnParam,
  goNearToAtom,
  parseBurnApiParam,
  parseMintApiParam,
  stringifyObjWithBigint,
  yoctoNearToAtom,
  atomToYoctoNear,
};

import { ENV } from './dotenv';
import { BridgeError, ERRORS } from './errors';
import { z } from 'zod';
import { logger } from './logger';
import { utils } from 'near-api-js';

type MintApiParam = z.infer<typeof zMintApiParam>;
type BurnApiParam = z.infer<typeof zBurnApiParam>;

type AlgoTxnParam = z.infer<typeof zAlgoTxnParam>;
type NearTxnParam = z.infer<typeof zNearTxnParam>;

type AlgoAddr = z.infer<typeof zAlgoAddr>;
type NearAddr = z.infer<typeof zNearAddr>;

type NearTxnId = z.infer<typeof zNearTxnId>;
type AlgoTxnId = z.infer<typeof zAlgoTxnId>;
// param validation and formatting

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

const zNearTxnId = z.string(); // TODO: unfinished
const zAlgoTxnId = z.string(); // TODO: unfinished

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

// goNear related
// TODO: rename. it converts all format to goNEAR atom.

function goNearToAtom(goNearPlain: string | number): bigint {
  // TODO: typing: return value should be a BigInt

  // TODO: l10n: this only converts 1,234,567.0123456789 to 12345670123456789
  // TODO: l10n: and won't work for separators like 123_4567.0123456789 nor 1.234.567,0123456789
  // TODO: l10n: temp-fix: added an regex to make sure that the input is in correct format
  let goNear: string;
  if (typeof goNearPlain === 'number') {
    goNear = goNearPlain.toString();
  } else if (typeof goNearPlain === 'string') {
    goNear = goNearPlain;
  } else {
    throw new BridgeError(ERRORS.INTERNAL.TYPE_ERROR, {
      goNearType: typeof goNearPlain,
    });
  }

  // from https://github.com/near/near-api-js/blob/6f83d39f47624b4223746c0d27d10f78471575f7/src/utils/format.ts#L46-L53
  goNear.replace(/,/g, '').trim(); // remove comma
  const split = goNear.split('.');
  const wholePart = split[0];
  const fracPart = split[1] || ''; // maybe ?? is better?
  if (split.length > 2 || fracPart.length > ENV.GO_NEAR_DECIMALS) {
    throw new BridgeError(ERRORS.INTERNAL.INVALID_GO_NEAR_AMOUNT, {
      goNearPlain: goNear,
    });
  }
  const atomAmount = BigInt(
    trimLeadingZeroes(wholePart + fracPart.padEnd(ENV.GO_NEAR_DECIMALS, '0'))
  );
  logger.debug('goNearToAtom', {
    goNearPlain: goNear,
    wholePart,
    fracPart,
    atomAmount,
  });
  return atomAmount;
}

/**
 * Removes leading zeroes from an input
 * @param value A value that may contain leading zeroes
 * @returns string The value without the leading zeroes
 */
function trimLeadingZeroes(value: string): string {
  // from https://github.com/near/near-api-js/blob/6f83d39f47624b4223746c0d27d10f78471575f7/src/utils/format.ts#L83-L88
  value = value.replace(/^0+/, '');
  if (value === '') {
    return '0';
  }
  return value;
}

function yoctoNearToAtom(yoctoNear: string | number | bigint): bigint {
  // TODO: rounding
  let yNear: string;

  if (typeof yoctoNear === 'number') {
    yNear = yoctoNear.toString();
    if (yNear.includes('.')) {
      throw new BridgeError(ERRORS.INTERNAL.INVALID_YOCTO_NEAR_AMOUNT, {
        yoctoNear: yNear,
      });
    }
  } else if (typeof yoctoNear === 'string') {
    yNear = yoctoNear;
  } else if (typeof yoctoNear === 'bigint') {
    yNear = yoctoNear.toString();
  } else {
    throw new BridgeError(ERRORS.INTERNAL.TYPE_ERROR, {
      goNearType: typeof yoctoNear,
    });
  }

  const nearPlain = utils.format.formatNearAmount(yNear);
  if (nearPlain === null) {
    throw new BridgeError(ERRORS.INTERNAL.INVALID_YOCTO_NEAR_AMOUNT, {
      yNear,
    });
  }
  return goNearToAtom(nearPlain);
}

// TODO: add test.
function atomToYoctoNear(atom: bigint): string {
  const coeStr = '0'.repeat(24 - ENV.GO_NEAR_DECIMALS);
  return atom.toString() + coeStr;
}

// TODO: ADD TEST
function stringifyObjWithBigint(obj?: object): string {
  // modified from https://github.com/GoogleChromeLabs/jsbi/issues/30
  if (!obj) {
    return '';
  }
  return JSON.stringify(
    obj,
    (key, value) => (typeof value === 'bigint' ? value.toString() : value) // return everything else unchanged
  );
}
