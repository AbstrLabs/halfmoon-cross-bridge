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

import { Stringer } from './type/type';

const exampleNearTxnId = '8mdZck4aC7UCNsM86W7fTqi8P9r1upw8vtoFscqJwgC7'; // TODO: use temp string

/* LITERAL TEMPLATES */
const NOT_LOADED_FROM_ENV_STR = 'NOT_LOADED_FROM_ENV';
const NOT_LOADED_FROM_ENV_NUM = 1234567890;
const UNUSED_STR = 'not required value';
const UNUSED_BIGINT = BigInt(0);

const TXN_CONFIRMED = (
  from: Stringer,
  to: Stringer,
  blockchain: Stringer,
  amount: Stringer,
  txnID: Stringer,
  confirmRound: Stringer
) =>
  `Transaction from ${from} to ${to} on ${blockchain} blockchain of amount ${amount} (atomic unit) with id ${txnID} confirmed in round ${confirmRound}`;

const ASA_CREATED = (assetName: Stringer, txnId: Stringer, assetId: Stringer) =>
  `New ASA ${assetName} created with ${txnId} having id ${assetId}.`;

const NEAR_VERIFY_OUTCOME = (outcome: Stringer) =>
  `NEAR verifyCorrectness txnOutcome : ${JSON.stringify(outcome)}`;

const DB_ENTRY_CREATED = (tableName: Stringer, dbId: Stringer) =>
  `Created bridge txn in table ${tableName} with id ${dbId}`;
const FOURTEEN_ZEROS = '0'.repeat(14);

const literals = {
  ASA_CREATED,
  DB_ENTRY_CREATED,
  FOURTEEN_ZEROS,
  NEAR_VERIFY_OUTCOME,
  NOT_LOADED_FROM_ENV_STR,
  NOT_LOADED_FROM_ENV_NUM,
  TXN_CONFIRMED,
  UNUSED_STR,
  UNUSED_BIGINT,
};

export function getNonce(): string {
  return Math.floor(Math.random() * 1000000).toString();
}
