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
  txType: Stringer,
  amount: Stringer,
  from: Stringer,
  to: Stringer
) => `Making ${txType} transaction of ${amount} from ${from} to ${to}`;

const START_MINTING = (amount: Stringer, from: Stringer, to: Stringer) =>
  `Minting ${amount} NEAR from [${from}](NEAR) to [${to}](ALGO).`;

const MINT_NEAR_TX_ID = (txId: Stringer) =>
  `Mint stake with transaction ID [${txId}](NEAR).`;
const DONE_MINT = 'mint success';
const MINT_AWAITING = 'Will redirect to "history" after transaction finished.';
const TXN_CONFIRMED = (
  from: Stringer,
  to: Stringer,
  amount: Stringer,
  txID: Stringer,
  confirmRound: Stringer
) =>
  `Transaction from ${from} to ${to} of amount ${amount} (atomic unit) with id ${txID} confirmed in round ${confirmRound}`;

const ASA_CREATED = (assetName: Stringer, txId: Stringer, assetId: Stringer) =>
  `New ASA ${assetName} created with ${txId} having id ${assetId}.`;

const NEAR_TXN_RESULT = (result: Stringer) => `near txn result: ${result}`;
const NEAR_VERIFY_OUTCOME = (outcome: Stringer) =>
  `NEAR verifyCorrectness txnOutcome : ${outcome}`;

const SILLY_LOG = {};
const literal = {
  MAKING_TXN,
  START_MINTING,
  DONE_MINT,
  TXN_CONFIRMED,
  SILLY_LOG,
  ASA_CREATED,
  NEAR_TXN_RESULT,
  NEAR_VERIFY_OUTCOME,
  MINT_NEAR_TX_ID,
  MINT_AWAITING,
};
