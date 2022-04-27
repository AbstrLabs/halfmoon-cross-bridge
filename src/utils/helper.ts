export { ensureString };
function ensureString(value: any): string {
  if (typeof value !== 'string') {
    throw new Error('value is not string type');
  }
  return value as string;
}
