/**
 * Here we define all the logs.
 * All logs should be defined here.
 */

export { log };

import { ENV } from '../dotenv';
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

// import { Stringer } from '../type/type';
// interface Log {
//   level: WinstonLevels;
//   message: string | ((...args: Stringer[]) => string);
// }

const template /* : Record<ModuleName, Record<LogName, Log>> */ = {
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
} as const;

const log: {
  [ModuleName in keyof typeof template]: {
    [LogName in keyof typeof template[ModuleName]]: (
      ...args: unknown[]
    ) => void;
  };
} = {
  MAIN: {
    loggerLevel: () => null,
    generalError: () => null,
    nodeEnv: () => null,
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
    (log[_moduleName][_logName] as () => void) = () => {
      logger[template[_moduleName][_logName].level](
        template[_moduleName][_logName].message
      );
    };
  }
}
