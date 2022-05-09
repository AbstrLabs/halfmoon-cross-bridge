// TODO: INVALID_TXN_ID should ren to TXN

export { ERRORS };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  UNKNOWN_TXN_TYPE: {
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
  INVALID_BRIDGE_TXN_PARAM: {
    errId: 108,
    name: 'Invalid Bridge Transaction Parameter',
    message:
      'Both group of (fromBlockchain,toBlockchain) and (txnType) are undefined.',
  },
  UNKNOWN_CONFIRM_OUTCOME: {
    errId: 109,
    name: 'Unknown confirm outcome',
    message: 'Unknown confirm outcome',
  },
  TYPE_ERR_BIGINTER: {
    errId: 110,
    name: 'Type Error BigInter',
    message: 'BigInter type parsing error',
  },
  TYPE_ERR_BIGINT: {
    errId: 111,
    name: 'Type Error BigInt',
    message: 'BigInt type parsing error',
  },
};

const transactionErrors = {
  INVALID_TXN_ID: {
    errId: 200,
    name: 'Invalid transaction id',
    message: 'Blockchain rejected malformed transaction id',
  },
  TXN_NOT_CONFIRMED: {
    errId: 201,
    name: 'Transaction not confirmed',
    message: 'Blockchain(indexer) cannot confirm transaction',
  },
  TXN_ASSET_ID_MISMATCH: {
    errId: 202,
    name: 'Transaction asset id mismatch',
    message: 'Transaction asset id does not match asset id in blockchain',
  },
  TXN_ID_MISMATCH: {
    errId: 203,
    name: 'Transaction txn id mismatch',
    message: 'Transaction txn id does not match txn id in blockchain',
  },
  TXN_SENDER_MISMATCH: {
    errId: 204,
    name: 'Transaction sender mismatch',
    message: 'Transaction sender does not match sender in blockchain',
  },
  TXN_RECEIVER_MISMATCH: {
    errId: 205,
    name: 'Transaction receiver mismatch',
    message: 'Transaction receiver does not match receiver in blockchain',
  },
  TXN_AMOUNT_MISMATCH: {
    errId: 206,
    name: 'Transaction amount mismatch',
    message: 'Transaction amount does not match amount in blockchain',
  },
  TXN_NOT_FOUND: {
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
  TXN_ASSET_ID_NOT_MATCH: {
    errId: 210,
    name: 'Transaction asset id not match',
    message: 'Transaction asset id does not match asset id in blockchain',
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
  DB_TXN_NOT_FOUND: {
    errId: 303,
    name: 'DB transaction not found',
    message: 'Transaction not found in database',
  },
  DB_TXN_NOT_UNIQUE: {
    errId: 304,
    name: 'DB transaction not unique',
    message: 'Transaction not unique in database',
  },
  DB_CREATE_TXN_FAILED: {
    errId: 305,
    name: 'DB create transaction failed',
    message: 'Cannot create transaction in database',
  },
  MAKE_OUTGOING_TXN_FAILED: {
    errId: 306,
    name: 'Make outgoing transaction failed',
    message: 'Cannot make outgoing transaction on blockchain',
  },
  INVALID_DB_ITEM: {
    errId: 307,
    name: 'Invalid database item',
    message: 'Invalid database item',
  },
};

const ERRORS = {
  INTERNAL: internalErrors,
  TXN: transactionErrors,
  EXTERNAL: externalErrors,
};
