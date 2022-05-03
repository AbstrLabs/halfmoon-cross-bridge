export { ERRORS };

import { ErrorGroup, ErrorTemplate } from '.';

const ERROR_RANGES = {
  // TODO: Ren TXN, to API, and its number to 100.
  INTERNAL: { min: 100, max: 199, title: 'API call and server errors' },
  TXN: { min: 200, max: 299, title: 'Transaction related errors' },
  EXTERNAL: { min: 300, max: 399, title: 'DB service and blockchain errors' },
};

const internalErrors = {
  NOT_IMPLEMENTED: {
    errId: 100,
    name: 'Not Implemented',
    message: 'Not implemented',
  },
  UNKNOWN_TX_TYPE: {
    errId: 101,
    name: 'Unknown Transaction Type',
    message: 'Wrong internal Transaction Type. Should be MINT or BURN',
  },
  DB_CLASS_LOGIC_ERROR: {
    errId: 102,
    name: 'DB Class Logic Error',
    message: 'client and isConnected do not match',
  },
  DB_UNAUTHORIZED_ACTION: {
    errId: 103,
    name: 'DB Unauthorized Action',
    message: 'Trying to execute an unauthorized DB action',
  },
  INVALID_GO_NEAR_AMOUNT: {
    errId: 104,
    name: 'Invalid Go Near Amount',
    message: 'Go Near amount is not valid, cannot parse.',
  },
  TYPE_ERROR: {
    errId: 105,
    name: 'Type Error',
    message: 'Variable type error',
  },
  INVALID_YOCTO_NEAR_AMOUNT: {
    errId: 106,
    name: 'Invalid Yocto Near Amount',
    message: 'Yocto Near amount is not valid, cannot parse.',
  },
  INVALID_AMOUNT: {
    errId: 107,
    name: 'Invalid Amount',
    message: 'Amount is not valid (internal error).',
  },
};
const transactionErrors = {
  INVALID_TX_ID: {
    errId: 200,
    name: 'Invalid transaction id',
    message: 'Blockchain rejected malformed transaction id',
  },
  TX_NOT_CONFIRMED: {
    errId: 201,
    name: 'Transaction not confirmed',
    message: 'Blockchain(indexer) cannot confirm transaction',
  },
  TX_ASSET_ID_MISMATCH: {
    errId: 202,
    name: 'Transaction asset id mismatch',
    message: 'Transaction asset id does not match asset id in blockchain',
  },
  TX_TX_ID_MISMATCH: {
    errId: 203,
    name: 'Transaction txn id mismatch',
    message: 'Transaction txn id does not match txn id in blockchain',
  },
  TX_SENDER_MISMATCH: {
    errId: 204,
    name: 'Transaction sender mismatch',
    message: 'Transaction sender does not match sender in blockchain',
  },
  TX_RECEIVER_MISMATCH: {
    errId: 205,
    name: 'Transaction receiver mismatch',
    message: 'Transaction receiver does not match receiver in blockchain',
  },
  TX_AMOUNT_MISMATCH: {
    errId: 206,
    name: 'Transaction amount mismatch',
    message: 'Transaction amount does not match amount in blockchain',
  },
  TX_NOT_FOUND: {
    errId: 207,
    name: 'Transaction not found',
    message: 'Transaction not found in blockchain',
  },
  MISSING_PARAM: {
    errId: 208,
    name: 'Missing parameter',
    message: 'API call parameters are missing',
  },
  INVALID_API_PARAM: {
    errId: 209,
    name: 'Invalid API parameter',
    message: 'API call parameters are invalid',
  },
};
const externalErrors = {
  DB_CONNECTION_FAILED: {
    errId: 300,
    name: 'DB connection failed',
    message: 'Cannot connect to database service',
  },
  DB_QUERY_FAILED: {
    errId: 301,
    name: 'DB query failed',
    message: 'Cannot query with database service',
  },
  MAKE_TXN_FAILED: {
    errId: 302,
    name: 'Make transaction failed',
    message: 'Cannot make transaction on blockchain',
  },
  DB_TX_NOT_FOUND: {
    errId: 303,
    name: 'DB transaction not found',
    message: 'Transaction not found in database',
  },
  DB_TX_NOT_UNIQUE: {
    errId: 304,
    name: 'DB transaction not unique',
    message: 'Transaction not unique in database',
  },
};

const ERRORS = {
  INTERNAL: internalErrors,
  TXN: transactionErrors,
  EXTERNAL: externalErrors,
};
