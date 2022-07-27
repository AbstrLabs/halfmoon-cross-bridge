export { setImmediateInterval, pause, bigintBips, optionalBigInt, expandError };

import BigNumber from 'bignumber.js';
import { Biginter, parseBigInt } from '../common/src/type/zod-basic';

/**
 * Asynchronously function pause for a certain time in milliseconds.
 *
 * @param ms - Milliseconds to pause
 * @returns
 */

async function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Set an interval whose callback will be called immediately.
 *
 * @param func - The callback to call
 * @param interval_ms - The interval in milliseconds
 * @returns A {@link NodeJS.Timer} object same as setInterval
 */
function setImmediateInterval(
  func: () => unknown,
  interval_ms: number
): NodeJS.Timer {
  func();
  return setInterval(func, interval_ms);
}

function bigintBips(
  bigint: bigint,
  bips: number | bigint | BigNumber,
  option: {
    rounding: 'FLOOR' | 'CEIL'; // | 'round'
  } = { rounding: 'CEIL' }
): bigint {
  let ratio: BigNumber;
  if (typeof bips === 'number') {
    ratio = new BigNumber(bips / 10000);
  } else if (typeof bips === 'bigint') {
    ratio = new BigNumber(bips.toString()).div(10000);
  } else {
    ratio = bips.div(10000);
  }
  const bn = new BigNumber(bigint.toString());
  const multi = bn.times(ratio);
  const [integer, fractional] = multi.toString().split('.');
  const flooredResult = BigInt(integer);
  if (option.rounding === 'FLOOR') {
    return flooredResult;
  } else {
    //if (option.rounding === 'ceil') {
    // fractional can be undefined
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (fractional === undefined) {
      return flooredResult;
    }
    if (fractional.match(/^0*$/) !== null) {
      return flooredResult;
    }
    return flooredResult + 1n;
  }
}

function optionalBigInt(value: Biginter | undefined): bigint | undefined {
  if (value === undefined) {
    return value;
  }
  return BigInt(parseBigInt(value));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function expandError(err: any) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  return { name: err.name, message: err.message, stack: err.stack };
}
