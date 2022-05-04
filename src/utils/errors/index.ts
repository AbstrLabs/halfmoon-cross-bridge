/* All errors of this project */
// inspirited by
// - https://github.com/scale-it/algo-builder/blob/master/packages/web/src/errors/errors-list.ts
// - https://github.com/scale-it/algo-builder/blob/master/packages/runtime/src/errors/errors-list.ts

export { ErrorTemplate, ErrorGroup, BridgeError };
export { ERRORS } from './error-list';

const ERROR_PREFIX = 'ANB';
interface ErrorTemplate {
  message: string;
  name: string;
  errId: number;
}
type ErrorGroup = { [errorName: string]: ErrorTemplate };
type ErrorCategory = {
  [category: string /* in keyof typeof ERROR_RANGES */]: ErrorGroup;
};
class BridgeError extends Error {
  public readonly errId: number;

  constructor(errorTemplate: ErrorTemplate, extraArg?: object) {
    super(
      // TODO: add extraArg to message
      `${ERROR_PREFIX} ${String(errorTemplate.errId)}: \n` +
        `${errorTemplate.message}: ${JSON.stringify(extraArg)}`
    );

    this.name = errorTemplate.name;
    this.errId = errorTemplate.errId;

    Object.setPrototypeOf(this, BridgeError.prototype);
  }
}
