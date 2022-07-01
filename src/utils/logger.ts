/**
 * An implementation of winston logger.
 *
 * @exports winston.Logger - {@link logger}
 */
// UNRESOLVED: https://github.com/facebook/jest/issues/8790

import { createLogger, format, transports } from 'winston';
import { ENV } from './dotenv';
// Calling `loadDotEnv()` here would cause `error: uncaughtException: (0 , dotenv_1.loadDotEnv) is not a function`
// Because `logger` is imported in `errors` which is imported in `dotenv.ts` which is imported here.
// But importing ENV will not cause the problem assumably because `logger` is used before initialization of `ENV`.

const { combine, timestamp, prettyPrint, colorize, errors, printf } = format;

export { logger };

const logger = createLogger({
  transports: [
    new transports.Console({
      handleExceptions: true,
      format: combine(
        colorize({
          all: true,
        }),
        errors({ stack: true }),
        timestamp(),
        prettyPrint(),
        printf(({ level, message, timestamp }: Record<string, string>) => {
          return `${
            timestamp.slice(11, -5)
            // first 11 chars `2022-06-30T`, last 5 chars `.777Z`
          }Z ${
            level.slice(0, 9).concat(level.slice(-5)).padEnd(15)
            // 'X[32m', 'verbo' + 'X[39m'
          }: ${message}`;
        })
      ),
    }),
    // new transports.File({ filename: 'combined.log' }),
  ],
  level: ENV.LOGGER_LEVEL,
  format: combine(
    errors({ stack: true }), // <-- use errors format
    timestamp(),
    prettyPrint()
  ),
});
