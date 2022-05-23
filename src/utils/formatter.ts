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

import { BridgeError, ERRORS } from './errors';

import { ENV } from './dotenv';
import { literals } from './literals';
import { logger } from './logger';
import { utils } from 'near-api-js';

/* UNIT CONVERSION OF goNear */

/**
 * Convert a human-readable string or number of NEAR amount to a bigint of atomNEAR.
 * Throw Error if input is not valid.
 *
 * @throws {BridgeError} - {@link ERRORS.INTERNAL.TYPE_ERROR} if input is not a string or number
 * @param  {string|number} goNearPlain - a human readable string of goNear
 * @return {bigint} - a bigint representation of the goNear
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
 * @param {string} value a value that may contain leading zeroes
 * @returns {string} the value without the leading zeroes
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
 * @throws {BridgeError} - {@link ERRORS.INTERNAL.TYPE_ERROR} if input is not a `string|number|bigint`
 * @throws {BridgeError} - {@link ERRORS.INTERNAL.INVALID_YOCTO_NEAR_AMOUNT} if input is not a valid yoctoNEAR amount
 * @param  {string|number|bigint} yoctoNear
 * @returns {bigint} a bigint representation of the atomNEAR.
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
 * Convert atomNEAR to yoctoNear.
 *
 * @param  {bigint} atom - a bigint representation of the atomNEAR
 * @returns {string} a string of yoctoNEAR amount
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
 * @param  {object} obj?
 * @returns {string}
 *
 * @todo add test
 */
function stringifyObjWithBigint(obj?: object): string {
  if (!obj) {
    return '';
    logger.warn('stringifyObjWithBigint: no obj');
    // TODO: should raise error?
  }
  return JSON.stringify(stringifyBigintInObj(obj));
}
type Obj = Record<string, unknown>;

/**
 * Stringify all bigint in an object recursively.
 *
 * @param  {object} obj
 * @returns object
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
