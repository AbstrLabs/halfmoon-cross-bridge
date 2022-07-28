export { stringifyObjWithBigint, stringifyBigintInObj };

/**
 * JSON.stringify() an object with bigint without serializing problem.
 *
 *
 * @param obj - The object to stringify that might contain a bigint as its property value.
 * @returns Stringified object
 *
 * @todo add test
 */
function stringifyObjWithBigint(obj?: object): string {
  if (!obj) {
    return '';
    // TODO: should raise error?
  }
  return JSON.stringify(stringifyBigintInObj(obj));
}
type Obj = Record<string, unknown>;

/**
 * Stringify all bigint in an object recursively.
 *
 * @todo type this function with `(obj: Record<key, bigint|Types>) => Record<key, string|Types>`
 *
 * @param obj - The object to stringify that might contain a bigint as its property value.
 * @returns The object with all bigint value stringified.
 */
function stringifyBigintInObj(obj: object): object {
  const newObj: Obj = { ...obj };
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) {
      newObj[key] = value;
    } else if (typeof value === 'bigint') {
      newObj[key] = value.toString();
    } else if (typeof value === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      newObj[key] = stringifyBigintInObj(value);
    } else {
      newObj[key] = value;
    }
  }
  return newObj;
}
