/**
 *
 * All the literal templates used in the application.
 * Try to gather all strings in one place (here).
 *
 * named literals instead of literal to avoid conflict with zod package.
 */

/* eslint-disable @typescript-eslint/restrict-template-expressions */
// Templates will call `toString()` method automatically.

export { literals, exampleNearTxnId };

// import { Stringer } from './type/type';

const exampleNearTxnId = '8mdZck4aC7UCNsM86W7fTqi8P9r1upw8vtoFscqJwgC7'; // TODO: use temp string

/* LITERAL TEMPLATES */
const NOT_LOADED_FROM_ENV_STR = 'NOT_LOADED_FROM_ENV';
const NOT_LOADED_FROM_ENV_NUM = 1234567890;
const UNUSED_STR = 'not required value';
const UNUSED_BIGINT = BigInt(0);

const FOURTEEN_ZEROS = '0'.repeat(14);

const literals = {
  FOURTEEN_ZEROS,
  NOT_LOADED_FROM_ENV_STR,
  NOT_LOADED_FROM_ENV_NUM,
  UNUSED_STR,
  UNUSED_BIGINT,
};

export function getNonce(): string {
  return Math.floor(Math.random() * 1000000).toString();
}
