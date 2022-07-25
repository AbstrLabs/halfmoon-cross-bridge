/**
 * Here we define all the logs.
 * All logs should be defined here.
 */

export { newLog };

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
  },
} as const;

const newLog: {
  [ModuleName in keyof typeof template]: {
    [LogName in keyof typeof template[ModuleName]]: () => void;
  };
} = {
  MAIN: {
    loggerLevel: () => null,
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
    (newLog[_moduleName][_logName] as () => void) = () => {
      logger[template[_moduleName][_logName].level](
        template[_moduleName][_logName].message
      );
    };
  }
}
