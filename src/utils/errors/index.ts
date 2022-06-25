/** Build a new Error class {@link BridgeError} from the template.
 *
 * @exports BridgeError - {@link BridgeError}
 * @exports any - related constants and templates for {@link BridgeError}
 *
 * inspirited by
 * - https://github.com/scale-it/algo-builder/blob/master/packages/web/src/errors/errors-list.ts
 * - https://github.com/scale-it/algo-builder/blob/master/packages/runtime/src/errors/errors-list.ts
 */

import { logger } from '../logger';
import { stringifyObjWithBigint } from '../formatter';

export { ErrorTemplate, ErrorGroup, BridgeError };
export { ERRORS } from './error-list';

const ERROR_PREFIX = 'ANB';
interface ErrorTemplate {
  message: string;
  name: string;
  errId: number;
}
type ErrorGroup = Record<string, ErrorTemplate>;

//
// type ErrorCategory = {
//   [category: string /* in keyof typeof ERROR_RANGES */]: ErrorGroup;
// };

class BridgeError extends Error {
  public readonly errId: number;

  constructor(errorTemplate: ErrorTemplate, extraArg?: object) {
    // TODO: should implement next line
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Error

    // for ErrorTemplate:
    // https://github.com/scale-it/algo-builder/blob/da67c09ef26b0c6ee7d7de06156cdc64d9bc1ecd/packages/runtime/src/errors/runtime-errors.ts#L31
    const errMsg =
      `(ERR_CODE: ${ERROR_PREFIX}${String(errorTemplate.errId)}): \n` +
      `${errorTemplate.message}: ${stringifyObjWithBigint(extraArg)}`;
    super(errMsg);
    logger.error(errMsg);
    this.name = errorTemplate.name;
    this.errId = errorTemplate.errId;
    this.message = errMsg;
  }

  toString() {
    return this.message;
  }
}
