export {
  toGoNearAtom,
  stringifyObjWithBigint,
  yoctoNearToAtom,
  atomToYoctoNear,
};

import { BridgeError, ERRORS } from './errors';

import { ENV } from './dotenv';
import { literals } from './literals';
import { logger } from './logger';
import { utils } from 'near-api-js';

// goNear related
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
    });
  }

  // overflow
  if (yoctoNearStr.length > 19) {
    throw new BridgeError(ERRORS.INTERNAL.INVALID_YOCTO_NEAR_AMOUNT, {
      yoctoNear: yoctoNearStr,
      problem: 'too long, overflow',
    });
  }

  // rounding
  // TODO(test): with '0987654321098765432109876543210987654321' -> '0987654321098765432109876500000000000000'
  if (yoctoNearStr.endsWith(literals.FOURTEEN_ZEROS)) {
    logger.warn('yoctoNearToAtom: rounding DOWN to nearest atom');
    yoctoNearStr = yoctoNearStr.slice(0, -14) + literals.FOURTEEN_ZEROS;
  }

  // to goNear
  const nearPlain = utils.format.formatNearAmount(yoctoNearStr);
  if (nearPlain === null) {
    throw new BridgeError(ERRORS.INTERNAL.INVALID_YOCTO_NEAR_AMOUNT, {
      yNear: yoctoNearStr,
    });
  }
  return toGoNearAtom(nearPlain);
}

// TODO(test): ADD TEST
function atomToYoctoNear(atom: bigint): string {
  const coeStr = '0'.repeat(24 - ENV.GO_NEAR_DECIMALS);
  return atom.toString() + coeStr;
}

// TODO(test): ADD TEST
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

/* 
function stringifyObjWithBigint(obj?: object): string {
  // modified from https://github.com/GoogleChromeLabs/jsbi/issues/30
  if (obj === undefined) {
    return 'undefined';
  }
  if (obj === null) {
    return 'null';
  }
  return JSON.stringify(
    obj,
    // (key, value) => value.toString() // not working, [object Object] is returned
    (key, value) => {
      switch (true) {
        case typeof value === 'bigint':
          return value.toString();
        case value instanceof BridgeTxn:
          return value.toString();
        default:
          value;
      }
    } // return everything else unchanged
  );
}
 */
