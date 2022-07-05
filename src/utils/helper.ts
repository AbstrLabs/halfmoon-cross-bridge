export { ensureString, setImmediateInterval, pause };

import { BridgeError, ERRORS } from './errors';

/**
 * Ensure that the given value is a string.
 *
 * @deprecated - use zod types instead.
 * @throws {ERRORS.INTERNAL.TYPE_ERROR} if the value is not a string
 * @param  {unknown} value - the value to check
 * @returns {string} the value as a string
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
 * @param ms - milliseconds to pause
 * @returns
 */

async function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Set an interval whose callback will be called immediately.
 *
 * @param  {()=>unknown} func - the callback to call
 * @param  {number} interval - the interval in milliseconds
 * @returns {NodeJS.Timer} object same as setInterval
 */
function setImmediateInterval(
  func: () => unknown,
  interval: number
): NodeJS.Timer {
  func();
  return setInterval(func, interval);
}
