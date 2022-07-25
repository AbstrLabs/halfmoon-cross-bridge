/**
 * Here we define all the logs.
 * All logs should be defined here.
 *
 * @todo how to call logs
 * `log.ModuleName.LogName(parameters)` - Proxy, no auto completion, better than next like
 * - worse, passing str. log('ModuleName.LogName as string', parameters)
 * `log(ModuleName.LogName,parameters)` - Wrap logger, too many exports
 * `log(logTemplate.ModuleName.LogName,parameters)` - Wrap logger, less exports, too long
 */

export { log, newLog };

import { Stringer } from '../type/type';
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
  message: string | ((...args: Stringer[]) => string);
}

type ModuleName = string;
type LogName = string;
const template: Record<ModuleName, Record<LogName, Log>> = {
  MAIN: {
    loggerLevel: {
      level: WinstonLevels.info,
      message: `log level: ${logger.level}`,
    },
  },
};

declare global {
  interface ProxyConstructor {
    // eslint-disable-next-line @typescript-eslint/prefer-function-type
    new <TSource extends object, TTarget extends object>(
      target: TSource,
      handler: ProxyHandler<TSource>
    ): TTarget;
  }
}

const newLog: {
  [ModuleName in keyof typeof template]: {
    [LogName in keyof typeof template[ModuleName]]: () => void;
  };
} = {
  MAIN: {
    loggerLevel: () => null,
  },
  NotExist: {
    NotExist: () => null,
  },
};
for (const moduleName in template) {
  for (const logName in template[moduleName]) {
    newLog[moduleName][logName] = () => {
      logger[template[moduleName][logName].level](
        template[moduleName][logName].message
      );
    };
  }
}
const log = new Proxy<
  Record<ModuleName, Record<LogName, Log>>,
  Record<keyof typeof template, Record<LogName, () => void>>
>(template, {
  set() // _target: Record<ModuleName, Record<LogName, Log>>,
  // _key: ModuleName,
  // _value: Record<LogName, Log>
  {
    logger.error('cannot set');
    return false;
  },
  get(target: Record<ModuleName, Record<LogName, Log>>, key: ModuleName) {
    // if (!target[key]) {
    //   logger.error(`module ${key} not found`);
    //   return null;
    // }
    return new Proxy<Record<LogName, Log>, Record<LogName, () => void>>(
      target[key],
      {
        set() // _target: Record<LogName, Log>,
        // _key: LogName,
        // _value: Log
        {
          logger.error('cannot set');
          return false;
        },
        get(target: Record<LogName, Log>, key: LogName): () => void {
          // if (!target[key]) {
          //   logger.error(`log ${key} not found`);
          //   return null;
          // }
          const oldVal = target[key];
          const returned = () => {
            logger[oldVal.level](oldVal.message);
          };
          return returned;
        },
      }
    );
  },
});
