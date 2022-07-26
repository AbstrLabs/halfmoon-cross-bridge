/**
 * Here we define all the logs.
 * All logs should be defined here.
 */

export { log };

import { ENV } from '../dotenv';
import { ApiCallParam, TxnUid } from '../type/type';
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
    // TODO: /algorand-near
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
  },
} as const;

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
