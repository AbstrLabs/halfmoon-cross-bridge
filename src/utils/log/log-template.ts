/**
 * Here we define all the logs.
 * All logs should be defined here.
 */

export { log };

import { ENV } from '../dotenv';
import { TxnUid } from '../type/type';
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
