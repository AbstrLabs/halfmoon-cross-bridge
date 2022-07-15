export { ensureString, setImmediateInterval, pause };

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
