export { ERRORS };

const apiCallErrors = {
  INVALID_TXN_ID: {
    errId: 100,
    name: 'Invalid transaction id',
    message: 'Blockchain rejected malformed transaction id',
  },
  TXN_NOT_CONFIRMED: {
    errId: 101,
    name: 'Transaction not confirmed',
    message: 'Blockchain(indexer) cannot confirm transaction',
  },
  TXN_ASSET_ID_MISMATCH: {
    errId: 102,
    name: 'Transaction asset id mismatch',
    message: 'Transaction asset id does not match asset id in blockchain',
  },
  TXN_ID_MISMATCH: {
    errId: 103,
    name: 'Transaction txn id mismatch',
    message: 'Transaction txn id does not match txn id in blockchain',
  },
  TXN_SENDER_MISMATCH: {
    errId: 104,
    name: 'Transaction sender mismatch',
    message: 'Transaction sender does not match sender in blockchain',
  },
  TXN_RECEIVER_MISMATCH: {
    errId: 105,
    name: 'Transaction receiver mismatch',
    message: 'Transaction receiver does not match receiver in blockchain',
  },
  TXN_AMOUNT_MISMATCH: {
    errId: 106,
    name: 'Transaction amount mismatch',
    message: 'Transaction amount does not match amount in blockchain',
  },
  TXN_NOT_FOUND: {
    errId: 107,
    name: 'Transaction not found',
    message: 'Transaction not found in blockchain',
  },
  MISSING_PARAM: {
    errId: 108,
    name: 'Missing parameter',
    message: 'API call parameters are missing',
  },
  INVALID_API_PARAM: {
    errId: 109,
    name: 'Invalid API parameter',
    message: 'API call parameters are invalid',
  },
  TXN_ASSET_ID_NOT_MATCH: {
    errId: 110,
    name: 'Transaction asset id not match',
    message: 'Transaction asset id does not match asset id in blockchain',
  },
  REUSED_INCOMING_TXN: {
    errId: 111,
    name: 'Reused incoming transaction',
    message:
      'This incoming transaction is already in our DB. ' +
      'Outgoing transaction is dropped. We might need to do something with this user',
  },
};

const internalErrors = {
  NOT_IMPLEMENTED: {
    errId: 200,
    name: 'Not Implemented',
    message: 'Not implemented',
  },
  UNKNOWN_TXN_TYPE: {
    errId: 201,
    name: 'Unknown Transaction Type',
    message: 'Wrong internal Transaction Type. Should be MINT or BURN',
  },
  DB_CLASS_LOGIC_ERROR: {
    errId: 202,
    name: 'DB Class Logic Error',
    message: 'client and isConnected do not match',
  },
  DB_UNAUTHORIZED_ACTION: {
    errId: 203,
    name: 'DB Unauthorized Action',
    message: 'Trying to execute an unauthorized DB action',
  },
  INVALID_GO_NEAR_AMOUNT: {
    errId: 204,
    name: 'Invalid Go Near Amount',
    message: 'Go Near amount is not valid, cannot parse.',
  },
  TYPE_ERROR: {
    errId: 205,
    name: 'Type Error',
    message: 'Variable type error',
  },
  INVALID_YOCTO_NEAR_AMOUNT: {
    errId: 206,
    name: 'Invalid Yocto Near Amount',
    message: 'Yocto Near amount is not valid, cannot parse.',
  },
  INVALID_AMOUNT: {
    errId: 207,
    name: 'Invalid Amount',
    message: 'Amount is not valid (internal error).',
  },
  INVALID_BRIDGE_TXN_PARAM: {
    errId: 208,
    name: 'Invalid Bridge Transaction Parameter',
    message:
      'Both group of (fromBlockchain,toBlockchain) and (txnType) are undefined.',
  },
  UNKNOWN_CONFIRM_OUTCOME: {
    errId: 209,
    name: 'Unknown confirm outcome',
    message: 'Unknown confirm outcome',
  },
  TYPE_ERR_BIGINTER: {
    errId: 210,
    name: 'Type Error BigInter',
    message: 'BigInter type parsing error',
  },
  TYPE_ERR_BIGINT: {
    errId: 211,
    name: 'Type Error BigInt',
    message: 'BigInt type parsing error',
  },
  DB_NOT_CONNECTED: {
    errId: 212,
    name: 'DB Not Connected',
    message: 'DB is not connected when it should be.',
  },
  BRIDGE_TXN_INITIALIZATION_ERROR: {
    errId: 213,
    name: 'Bridge Transaction Initialization Error',
    message: 'Bridge Transaction initialization error',
  },
  ILLEGAL_TXN_STATUS: {
    errId: 214,
    name: 'Illegal Transaction Status',
    message: 'Transaction Status can only move in a certain sequence',
  },
  UNKNOWN_BLOCKCHAIN_NAME: {
    errId: 215,
    name: 'Unknown Blockchain Name',
    message: 'Blockchain Name not in BlockchainName enum',
  },
  CANNOT_DOTENV_LOAD: {
    errId: 216,
    name: 'Cannot Load .env',
    message: 'Cannot load .env file',
  },
  NETWORK_NOT_SUPPORTED: {
    errId: 217,
    name: 'Blockchain network Not Supported',
    message: 'Blockchain network not supported',
  },
  BRIDGE_TXN_NOT_INITIALIZED: {
    errId: 218,
    name: 'Bridge Transaction Not Initialized',
    message: 'Bridge Transaction not initialized as expected',
  },
  OVERWRITE_ERROR_TXN_STATUS: {
    errId: 219,
    name: 'Overwrite Error Transaction Status',
    message:
      'Trying to overwrite error status in in bridge transaction status.' +
      'When a bridge transaction has error status, manual fix is needed.',
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
  CONFIRM_OUTGOING_TXN_FAILED: {
    errId: 308,
    name: 'Confirm outgoing transaction failed',
    message: 'Cannot confirm outgoing transaction on blockchain',
  }, // maybe not in this category?
  EMPTY_NEW_TXN_ID: {
    errId: 309,
    name: 'Empty new transaction id',
    message: 'New transaction id is undefined',
  },
};

const ERRORS = {
  INTERNAL: internalErrors,
  API: apiCallErrors,
  EXTERNAL: externalErrors,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ERROR_RANGES = {
  API: { min: 100, max: 199, title: 'Transaction related errors' },
  INTERNAL: { min: 200, max: 299, title: 'API call and server errors' },
  EXTERNAL: { min: 300, max: 399, title: 'DB service and blockchain errors' },
};
