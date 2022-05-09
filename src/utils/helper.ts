export { ensureString, setImmediateInterval, sleep, optionalBigInt };

import { BridgeError, ERRORS } from './errors';

import { Biginter } from './type';

function ensureString(value: unknown): string {
  if (typeof value !== 'string') {
    throw new BridgeError(ERRORS.INTERNAL.TYPE_ERROR, {
      expected: 'string',
      actual: typeof value,
    });
  }
  return value as string;
}

function setImmediateInterval(
  func: () => unknown,
  interval: number
): NodeJS.Timer {
  func();
  return setInterval(func, interval);
}

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

// TODO: ADD TEST
function optionalBigInt(value: Biginter): bigint;
function optionalBigInt(value: undefined): undefined;
function optionalBigInt(value: Biginter | undefined): bigint | undefined {
  if (value === undefined) {
    return undefined;
  } else {
    return BigInt(value);
  }
}
