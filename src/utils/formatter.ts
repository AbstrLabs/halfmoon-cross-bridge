/**
 * Helper function to convert between different formats, like units of NEAR, type of object, etc.
 */
export {
  toGoNearAtom,
  stringifyObjWithBigint,
  yoctoNearToAtom,
  atomToYoctoNear,
  stringifyBigintInObj,
};

import { BridgeError, ERRORS } from './bridge-error';

import { ENV } from './dotenv';
import { literals } from './bridge-const';
import { logger } from './log/logger';
import { utils } from 'near-api-js';

/* UNIT CONVERSION OF goNear */

/**
 * Convert a human-readable string or number of NEAR amount to a bigint of atomNEAR.
 * Throw Error if input is not valid.
 *
 * @throws {@link ERRORS.INTERNAL.TYPE_ERROR} if input is not a string or number
 * @param goNearPlain - A human readable string or number of goNear
 * @returns A bigint representation of the goNear atomic unit
 */
function toGoNearAtom(goNearPlain: string | number): bigint {
  // TODO: l10n: temp-fix: added an regex to make sure that the input is in correct format
  // l10n: this only converts 1,234,567.0123456789 to 12345670123456789
  // l10n: and won't work for separators like 123_4567.0123456789 nor 1.234.567,0123456789
  let goNearString: string;
  if (typeof goNearPlain === 'number') {
    goNearString = goNearPlain.toString();
  } else if (typeof goNearPlain === 'string') {
    goNearString = goNearPlain;
  } else {
    throw new BridgeError(ERRORS.INTERNAL.TYPE_ERROR, {
      goNearType: typeof goNearPlain,
    });
  }

  // from https://github.com/near/near-api-js/blob/6f83d39f47624b4223746c0d27d10f78471575f7/src/utils/format.ts#L46-L53
  goNearString.replace(/,/g, '').trim(); // remove comma
  const split = goNearString.split('.');
  const wholePart = split[0];
  const fracPart = split[1] || ''; // maybe ?? is better?
  if (split.length > 2 || fracPart.length > ENV.GO_NEAR_DECIMALS) {
    throw new BridgeError(ERRORS.INTERNAL.INVALID_GO_NEAR_AMOUNT, {
      goNearPlain: goNearString,
    });
  }
  const atomAmount = BigInt(
    trimLeadingZeroes(wholePart + fracPart.padEnd(ENV.GO_NEAR_DECIMALS, '0'))
  );
  logger.debug({
    at: 'toGoNearAtom',
    goNearPlain: goNearString,
    wholePart,
    fracPart,
    atomAmount,
  });
  return atomAmount;
}

/**
 * Remove leading zeroes from an input.
 *
 * @param value - a value that may contain leading zeroes
 * @returns the same {@link value} without the leading zeroes
 */
function trimLeadingZeroes(value: string): string {
  // from https://github.com/near/near-api-js/blob/6f83d39f47624b4223746c0d27d10f78471575f7/src/utils/format.ts#L83-L88
  value = value.replace(/^0+/, '');
  if (value === '') {
    return '0';
  }
  return value;
}

/**
 * Convert a string of yoctoNEAR to a bigint of atomNEAR.
 *
 * @throws {@link ERRORS.INTERNAL.TYPE_ERROR} if input is not a `type string|number|bigint`
 * @throws {@link ERRORS.INTERNAL.INVALID_YOCTO_NEAR_AMOUNT} if input is not a valid yoctoNEAR amount
 * @param yoctoNear - amount of the yoctoNEAR in string, number or bigint
 * @returns A bigint representation of the atomNEAR.
 *
 * @todo rename to yoctoNearToAtomNear
 *
 */
function yoctoNearToAtom(yoctoNear: string | number | bigint): bigint {
  // format to string
  let yoctoNearStr: string;
  if (typeof yoctoNear === 'number') {
    yoctoNearStr = yoctoNear.toString();
  } else if (typeof yoctoNear === 'string') {
    yoctoNearStr = yoctoNear;
  } else if (typeof yoctoNear === 'bigint') {
    yoctoNearStr = yoctoNear.toString();
  } else {
    throw new BridgeError(ERRORS.INTERNAL.TYPE_ERROR, {
      goNearType: typeof yoctoNear,
    });
  }
  if (yoctoNearStr.includes('.')) {
    throw new BridgeError(ERRORS.INTERNAL.INVALID_YOCTO_NEAR_AMOUNT, {
      yoctoNear: yoctoNearStr,
      problem: 'contains a decimal point, not integer',
    });
  }

  // overflow
  if (yoctoNearStr.length > 19 + 14) {
    throw new BridgeError(ERRORS.INTERNAL.INVALID_YOCTO_NEAR_AMOUNT, {
      yoctoNear: yoctoNearStr,
      problem: 'too long, overflow',
    });
  }

  // rounding
  // TODO(test): with '0987654321098765432109876543210987654321' -> '0987654321098765432109876500000000000000'
  if (!yoctoNearStr.endsWith(literals.FOURTEEN_ZEROS)) {
    logger.warn('yoctoNearToAtom: rounding DOWN to nearest atom');
    yoctoNearStr = yoctoNearStr.slice(0, -14) + literals.FOURTEEN_ZEROS;
  }

  // to goNear
  const nearPlain = utils.format.formatNearAmount(yoctoNearStr);
  // if (nearPlain === undefined) {
  //   throw new BridgeError(ERRORS.INTERNAL.INVALID_YOCTO_NEAR_AMOUNT, {
  //     yNear: yoctoNearStr,
  //   });
  // }
  return toGoNearAtom(nearPlain);
}

/**
 * Convert atomNEAR to yoctoNear. Due to the JS {@link Number.MAX_SAFE_INTEGER} limit,
 * the result is output as a string.
 *
 * @param atom - a bigint representation of the atomNEAR
 * @returns A string of yoctoNEAR amount
 *
 * @todo rename to atomNearToYoctoNear
 * @todo add test
 */
function atomToYoctoNear(atom: bigint): string {
  const coeStr = '0'.repeat(24 - ENV.GO_NEAR_DECIMALS);
  return atom.toString() + coeStr;
}

/**
 * JSON.stringify() an object with bigint without serializing problem.
 *
 *
 * @param obj - The object to stringify that might contain a bigint as its property value.
 * @returns Stringified object
 *
 * @todo add test
 */
function stringifyObjWithBigint(obj?: object): string {
  if (!obj) {
    logger.warn('stringifyObjWithBigint: no obj');
    return '';
    // TODO: should raise error?
  }
  return JSON.stringify(stringifyBigintInObj(obj));
}
type Obj = Record<string, unknown>;

/**
 * Stringify all bigint in an object recursively.
 *
 * @todo type this function with `(obj: Record<key, bigint|Types>) => Record<key, string|Types>`
 *
 * @param obj - The object to stringify that might contain a bigint as its property value.
 * @returns The object with all bigint value stringified.
 */
function stringifyBigintInObj(obj: object): object {
  const newObj: Obj = { ...obj };
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) {
      newObj[key] = value;
    } else if (typeof value === 'bigint') {
      newObj[key] = value.toString();
    } else if (typeof value === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      newObj[key] = stringifyBigintInObj(value);
    } else {
      newObj[key] = value;
    }
  }
  return newObj;
}
