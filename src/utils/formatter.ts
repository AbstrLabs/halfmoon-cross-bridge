//TODO: separate to type file.

export {
  goNearToAtom,
  stringifyObjWithBigint,
  yoctoNearToAtom,
  atomToYoctoNear,
};

import { BridgeError, ERRORS } from './errors';

import { ENV } from './dotenv';
import { logger } from './logger';
import { utils } from 'near-api-js';

// param validation and formatting

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
