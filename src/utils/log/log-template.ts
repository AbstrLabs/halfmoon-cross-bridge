/**
 * Here we define all the logs.
 * All logs should be defined here.
 */

export { log };

import { BlockchainName, BridgeTxnActionName } from '../..';
import { TableName } from '../../database';
import { ENV } from '../dotenv';
import { BridgeTxnStatusEnum } from '../type/shared-types/txn';
import {
  AlgoAddr,
  AlgoTxnParam,
  ApiCallParam,
  DbId,
  DbItem,
  TxnParam,
  TxnUid,
} from '../type/type';
import { logger } from './logger';

enum WinstonLevels {
  error = 'error',
  warn = 'warn',
  help = 'help',
  data = 'data',
  info = 'info',
  debug = 'debug',
  prompt = 'prompt',
  verbose = 'verbose',
  input = 'input',
  silly = 'silly',
}

interface Log {
  level: WinstonLevels;
  message: string | ((...args: unknown[]) => string);
}
// type ModuleName = string;
// type LogName = string;

const template /* : Record<ModuleName, Record<LogName, Log>>  */ = {
  MAIN: {
    loggerLevel: {
      level: WinstonLevels.info,
      message: `log level: ${logger.level}`,
    },
    generalError: {
      level: WinstonLevels.error,
      message: (err: unknown) => `general error ${JSON.stringify(err)}`,
    },
    nodeEnv: {
      level: WinstonLevels.info,
      message: `NODE_ENV: ${ENV.NODE_ENV}`,
    },
  },
  APIW: {
    //API Worker
    apiWorkerStarted: {
      level: WinstonLevels.info,
      message: `API Worker started`,
    },
    doubleMintError: {
      level: WinstonLevels.error,
      message: (err: unknown) =>
        `double mint, from_txn_id existed in DB. Error: ${JSON.stringify(err)}`,
    },
    apiWorkerCreatedBridgeTxn: {
      level: WinstonLevels.verbose,
      message: (uid: TxnUid) =>
        `bridge txn created with uid: ${uid.toString()}`,
    },
  },
  APIS: {
    //API Server
    // TODO: `/algorand-near` should be dynamic
    handledGetWithoutUid: {
      level: WinstonLevels.verbose,
      message: 'handled GET /algorand-near without UID',
    },
    handledGetWithMalformedUid: {
      level: WinstonLevels.verbose,
      message: (uid: TxnUid) =>
        `handled GET /algorand-near with bad UID: ${uid.toString()}`,
    },
    handledGetWithInvalidUid: {
      level: WinstonLevels.warn,
      message: (uid: TxnUid) =>
        `handled GET /algorand-near with invalid UID: ${uid.toString()}`,
    },
    handledGetWithValidUid: {
      level: WinstonLevels.verbose,
      message: (uid: TxnUid) =>
        `handled GET /algorand-near with valid UID: ${uid.toString()}`,
    },
    handledPost: {
      level: WinstonLevels.verbose,
      message: (apiCallParam: ApiCallParam) =>
        `Handled API POST call: ${JSON.stringify(apiCallParam)}`,
    },
    generalError: {
      level: WinstonLevels.error,
      message: (err: unknown) => `general error ${JSON.stringify(err)}`,
    },
    unknownError: {
      level: WinstonLevels.error,
      message: (err: unknown) => `unknown error: ${JSON.stringify(err)}`,
    },
    appStarted: {
      level: WinstonLevels.info,
      message: `Bridge application started on http://localhost:${ENV.PORT}/`,
    },
  },
  BLCH: {
    // Blockchain
    confirmTxn: {
      level: WinstonLevels.debug,
      message: (blockchainName: BlockchainName, txnParam: TxnParam) =>
        `Confirmed transaction from ${txnParam.fromAddr} to ${txnParam.toAddr} on ${blockchainName} blockchain of amount ${txnParam.atomAmount} (atomic unit) with id ${txnParam.txnId}.`,
    },
    confirmTxnError: {
      level: WinstonLevels.error,
      message: (
        blockchainName: BlockchainName,
        txnParam: TxnParam,
        err: unknown
      ) =>
        `${blockchainName} failed to confirm transaction ${JSON.stringify(
          txnParam
        )}. Error: ${JSON.stringify(err)}`,
    },
    getTxnStatusFailed: {
      level: WinstonLevels.error,
      message: (err: unknown) =>
        `Failed to get transaction status. Error: ${JSON.stringify(err)}`,
    },
  },
  ALGO: {
    // Algorand Blockchain
    failedToMakeAsaTxn: {
      level: WinstonLevels.error,
      message: (err: unknown) =>
        `Failed to make ASA transaction. Error: ${JSON.stringify(err)}`,
    },
    asaTransferTxnCreated: {
      level: WinstonLevels.verbose,
      message: (algoTxnParam: AlgoTxnParam) =>
        `ASA transaction created with id ${JSON.stringify(algoTxnParam)}`,
    },
    algoAccCreated: {
      level: WinstonLevels.warn,
      message: (addr: AlgoAddr, mnemonic: string) =>
        `Account Address = ${addr}\nAccount Mnemonic = ${mnemonic}\nAccount created. This mnemonic and address will show only once.\nAdd funds to account using the TestNet Dispenser: \nhttps://dispenser.testnet.aws.algodev.network/ \n`,
    },
    asaCreated: {
      level: WinstonLevels.verbose,
      message: (assetName: string, txnId: string, assetId: string) =>
        `New ASA ${assetName} created with ${txnId} having id ${assetId}.`,
    },
  },
  NEAR: {
    nearVerifyOutcome: {
      level: WinstonLevels.verbose,
      message: (outcome: string) =>
        `NEAR verifyCorrectness txnOutcome : ${JSON.stringify(outcome)}`,
    },
  },
  BTXN: {
    // Bridge Txn
    onConfirmIncome: {
      level: WinstonLevels.verbose,
      message: `Running confirmIncomingTxn.`,
    },
    onUpdateStatus: {
      level: WinstonLevels.debug,
      message: (txnUid: TxnUid, newStatus: BridgeTxnStatusEnum) =>
        `Updating status of txn ${txnUid} to: ${newStatus}`,
    },
    onUpdateStatusDone: {
      level: WinstonLevels.silly,
      message: (txnUid: TxnUid, newStatus: BridgeTxnStatusEnum) =>
        `Finished updating status of txn ${txnUid} to: ${newStatus}`,
    },
  },
  BWKR: {
    // Bridge Worker
    onStart: {
      level: WinstonLevels.info,
      message: `Bridge worker start running.`,
    },
    onIdle: {
      level: WinstonLevels.verbose, // info
      message: `No task left, fetching new tasks.`,
    },
    skipTxn: {
      level: WinstonLevels.debug,
      message: (txnUid: TxnUid) => `Skipping finished task ${txnUid}`,
    },
    loadTxn: {
      level: WinstonLevels.silly,
      message: (txnUid: TxnUid, txnStatus: BridgeTxnStatusEnum) =>
        // 57 = 52 max len + 1 for '.' + 3 for dbId + 1 for backup
        `Loaded bridgeTxn with uid: ${txnUid.padEnd(57)}, status: ${txnStatus}`,
    },
    onEmptyQueue: {
      level: WinstonLevels.verbose,
      message: `No task left to handle, should fetch new tasks.`,
    },
    handleTask: {
      level: WinstonLevels.verbose,
      message: (txnUid: TxnUid, txnStatus: BridgeTxnStatusEnum) =>
        `Handling task with uid: ${txnUid}, status: ${txnStatus}`,
    },
    finishedTask: {
      level: WinstonLevels.verbose,
      message: (txnUid: TxnUid) => `Finished task with uid: ${txnUid}`,
    },
    onTaskErrorEmail: {
      level: WinstonLevels.info,
      message: (txnUid: TxnUid) =>
        `Sending error email about error in task ${txnUid}`,
    },
    executingTask: {
      level: WinstonLevels.verbose,
      message: (
        actionName: BridgeTxnActionName,
        txnUid: TxnUid,
        status: BridgeTxnStatusEnum
      ) => `Executing ${actionName} on ${txnUid} with status ${status}.`,
    },
    executingTaskError: {
      level: WinstonLevels.error,
      message: (
        actionName: BridgeTxnActionName,
        txnUid: TxnUid,
        status: BridgeTxnStatusEnum,
        err: unknown
      ) =>
        `Error executing ${actionName} on ${txnUid} with status ${status}. Error: ${JSON.stringify(
          err
        )}`,
    },
    generalError: {
      level: WinstonLevels.error,
      message: (err: unknown) => `Error: ${JSON.stringify(err)}`,
    },
  },
  ARDS: {
    // AWS RDS
    onDoubleConnect: {
      level: WinstonLevels.verbose,
      message: `Double connect to RDS. (db is already connected)`,
    },
    onConnect: {
      level: WinstonLevels.info,
      message: `RDS database connected.`,
    },
  },
  DB: {
    // Database
    devMode: {
      level: WinstonLevels.info,
      message: `Using development database in dev mode.`,
    },
    testMode: {
      level: WinstonLevels.info,
      message: `Using test database in test mode.`,
    },
    itemCreated: {
      level: WinstonLevels.verbose,
      message: (tableName: TableName, dbId: DbId) =>
        `Created BridgeTxn in table ${tableName} with DbId ${dbId}`,
    },
    onReadAllFinished: {
      level: WinstonLevels.silly,
      message: (tableName: TableName, dbItems: DbItem[]) =>
        `readAllTxn from ${tableName} fetched ${
          dbItems.length
        } items:\n ${JSON.stringify(dbItems)}`,
    },
    onUpdateTxnFinished: {
      level: WinstonLevels.debug,
      message: (dbId: DbId, txnStatus: BridgeTxnStatusEnum) =>
        `Updated bridge txn with dbId ${dbId} to ${txnStatus}`,
    },
  },
  EMLS: {
    // Email service
    onSendEmail: {
      level: WinstonLevels.verbose,
      message: (to: string, title: string, extraMsg: string | undefined) =>
        `${extraMsg ?? ''}Sending email to: ${to} with title: ${title}.`,
    },
  },
  UTIL: {
    toGoNearAtomDebug: {
      level: WinstonLevels.debug,
      message: (debugObj: Record<string, string>) =>
        `toGoNearAtomDebug: ${JSON.stringify(debugObj)}`,
    },
    yoctoNearToAtomFloor: {
      level: WinstonLevels.warn,
      message: 'yoctoNearToAtom: rounding DOWN to nearest atom',
    },
  },
} as const;
Object.freeze(template);

const log: {
  [M in keyof typeof template]: {
    [L in keyof typeof template[M]]: (...args: unknown[]) => void;
  };
} = {
  MAIN: {
    loggerLevel: () => null,
    generalError: () => null,
    nodeEnv: () => null,
  },
  APIW: {
    apiWorkerStarted: () => null,
    doubleMintError: () => null,
    apiWorkerCreatedBridgeTxn: () => null,
  },
  APIS: {
    handledGetWithoutUid: () => null,
    handledGetWithMalformedUid: () => null,
    handledGetWithInvalidUid: () => null,
    handledGetWithValidUid: () => null,
    handledPost: () => null,
    generalError: () => null,
    unknownError: () => null,
    appStarted: () => null,
  },
  BLCH: {
    confirmTxn: () => null,
    confirmTxnError: () => null,
    getTxnStatusFailed: () => null,
  },
  ALGO: {
    failedToMakeAsaTxn: () => null,
    asaTransferTxnCreated: () => null,
    algoAccCreated: () => null,
    asaCreated: () => null,
  },
  NEAR: {
    nearVerifyOutcome: () => null,
  },
  BTXN: {
    onConfirmIncome: () => null,
    onUpdateStatus: () => null,
    onUpdateStatusDone: () => null,
  },
  BWKR: {
    onStart: () => null,
    onIdle: () => null,
    skipTxn: () => null,
    loadTxn: () => null,
    onEmptyQueue: () => null,
    handleTask: () => null,
    finishedTask: () => null,
    onTaskErrorEmail: () => null,
    executingTask: () => null,
    executingTaskError: () => null,
    generalError: () => null,
  },
  ARDS: {
    onDoubleConnect: () => null,
    onConnect: () => null,
  },
  DB: {
    devMode: () => null,
    testMode: () => null,
    itemCreated: () => null,
    onReadAllFinished: () => null,
    onUpdateTxnFinished: () => null,
  },
  EMLS: {
    onSendEmail: () => null,
  },
  UTIL: {
    toGoNearAtomDebug: () => null,
    yoctoNearToAtomFloor: () => null,
  },
  // NotExist: {
  //   NotExist: () => null,
  // },
};

for (const moduleName in template) {
  // type cast from https://github.com/microsoft/TypeScript/issues/3500
  const _moduleName = moduleName as keyof typeof template;
  for (const logName in template[_moduleName]) {
    const _logName = logName as keyof typeof template[typeof _moduleName];
    const logTemplate: Log = template[_moduleName][_logName];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (log[_moduleName][_logName] as () => void) = () => {
      logger[logTemplate.level](logTemplate.message);
    };
  }
}
