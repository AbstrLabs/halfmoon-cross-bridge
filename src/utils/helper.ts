export { ensureString, setImmediateInterval, pause, bigintBips };

import BigNumber from 'bignumber.js';
import { BridgeError, ERRORS } from './errors';

/**
 * Ensure that the given value is a string.
 *
 * @deprecated - Use zod types instead.
 * @throws {@link ERRORS.INTERNAL.TYPE_ERROR} If the value is not a string
 * @param value - The value to check
 * @returns The same value of {@link value} as a string
 */
function ensureString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new BridgeError(ERRORS.INTERNAL.TYPE_ERROR, {
      expected: 'string',
      actual: typeof value,
      value,
    });
  }
  return value;
}

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
    rounding: 'floor' | 'ceil'; // | 'round'
  } = { rounding: 'floor' }
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
  if (option.rounding === 'floor') {
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
