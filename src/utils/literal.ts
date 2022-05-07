// TODO: ren to literals for zod
export { literal };
type Stringer =
  | string
  | number
  | boolean
  | null
  | undefined
  | {
      toString(): string;
    };

export const NOT_LOADED_FROM_ENV = 'NOT_LOADED_FROM_ENV';

const MAKING_TXN = (
  txnType: Stringer,
  amount: Stringer,
  from: Stringer,
  to: Stringer
) => `Making ${txnType} transaction of ${amount} from ${from} to ${to}`;

const START_MINTING = (amount: Stringer, from: Stringer, to: Stringer) =>
  `Minting ${amount} NEAR from [${from}](NEAR) to [${to}](ALGO).`;
const START_BURNING = (amount: Stringer, from: Stringer, to: Stringer) =>
  `Burning ${amount} ALGO from [${from}](ALGO) to [${to}](NEAR)`;

const MINT_NEAR_TX_ID = (txnId: Stringer) =>
  `Minting with transaction ID [${txnId}](NEAR).`;
const BURN_ALGO_TX_ID = (txnId: Stringer) =>
  `Burning with transaction ID [${txnId}](ALGO).`;
const DONE_MINT = 'mint success';
const DONE_BURN = 'burn success';
const MINT_AWAITING =
  'Will redirect to "history" after mint transaction finished.';
const BURN_AWAITING =
  'Will redirect to "history" after burn transaction finished.';

const TXN_CONFIRMED = (
  from: Stringer,
  to: Stringer,
  amount: Stringer,
  txnID: Stringer,
  confirmRound: Stringer
) =>
  //TODO: on what chain??
  `Transaction from ${from} to ${to} of amount ${amount} (atomic unit) with id ${txnID} confirmed in round ${confirmRound}`;

const ASA_CREATED = (assetName: Stringer, txnId: Stringer, assetId: Stringer) =>
  `New ASA ${assetName} created with ${txnId} having id ${assetId}.`;

const NEAR_TXN_RESULT = (result: Stringer) => `near txn result: ${result}`;
const NEAR_VERIFY_OUTCOME = (outcome: Stringer) =>
  `NEAR verifyCorrectness txnOutcome : ${JSON.stringify(outcome)}`;
const UNUSED = 'not required value';
const DB_ENTRY_CREATED = (txnType: Stringer, dbId: Stringer) =>
  `Created bridge txn in table ${txnType} with id ${dbId}`;

const SILLY_LOG = {};

const literal = {
  ASA_CREATED,
  BURN_ALGO_TX_ID,
  BURN_AWAITING,
  DB_ENTRY_CREATED,
  DONE_BURN,
  DONE_MINT,
  MAKING_TXN,
  MINT_AWAITING,
  MINT_NEAR_TX_ID,
  NEAR_TXN_RESULT,
  NEAR_VERIFY_OUTCOME,
  SILLY_LOG,
  START_BURNING,
  START_MINTING,
  TXN_CONFIRMED,
  UNUSED,
};
