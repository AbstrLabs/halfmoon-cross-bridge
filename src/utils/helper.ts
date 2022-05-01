import { BridgeError, ERRORS } from './errors';

export { ensureString, setImmediateInterval, sleep };
function ensureString(value: any): string {
  if (typeof value !== 'string') {
    throw new BridgeError(ERRORS.INTERNAL.TYPE_ERROR, {
      expected: 'string',
      actual: typeof value,
    });
  }
  return value as string;
}

function setImmediateInterval(func: () => any, interval: number): NodeJS.Timer {
  func();
  return setInterval(func, interval);
}

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
