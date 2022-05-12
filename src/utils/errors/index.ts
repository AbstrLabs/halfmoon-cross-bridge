/* All errors of this project */
// inspirited by
// - https://github.com/scale-it/algo-builder/blob/master/packages/web/src/errors/errors-list.ts
// - https://github.com/scale-it/algo-builder/blob/master/packages/runtime/src/errors/errors-list.ts

import { stringifyObjWithBigint } from '../formatter';

export { ErrorTemplate, ErrorGroup, BridgeError };
export { ERRORS } from './error-list';

const ERROR_PREFIX = 'ANB';
interface ErrorTemplate {
  message: string;
  name: string;
  errId: number;
}
type ErrorGroup = { [errorName: string]: ErrorTemplate };

//
// type ErrorCategory = {
//   [category: string /* in keyof typeof ERROR_RANGES */]: ErrorGroup;
// };

class BridgeError extends Error {
  public readonly errId: number;

  constructor(errorTemplate: ErrorTemplate, extraArg?: object) {
    // for templated message:
    // https://github.com/scale-it/algo-builder/blob/da67c09ef26b0c6ee7d7de06156cdc64d9bc1ecd/packages/runtime/src/errors/runtime-errors.ts#L31
    super(
      `(ERR_CODE: ${ERROR_PREFIX}${String(errorTemplate.errId)}): \n` +
        `${errorTemplate.message}: ${stringifyObjWithBigint(extraArg)}`
    );

    this.name = errorTemplate.name;
    this.errId = errorTemplate.errId;

    Object.setPrototypeOf(this, BridgeError.prototype);
  }
}
