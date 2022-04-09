export { ensureString, setImmediateInterval };
function ensureString(value: any): string {
  if (typeof value !== 'string') {
    throw new Error('value is not string type');
  }
  return value as string;
}

function setImmediateInterval(func: () => any, interval: number): NodeJS.Timer {
  func();
  return setInterval(func, interval);
}
