/**
 * An implementation of winston logger.
 *
 * @exports winston.Logger - {@link logger}
 */
// UNRESOLVED: https://github.com/facebook/jest/issues/8790

export { logger };

import { createLogger, format, transports } from 'winston';
// Calling `ENV` or `loadDotEnv()` here would cause `error: uncaughtException: (0 , dotenv_1.loadDotEnv) is not a function`
// Because of circular reference: `logger` is imported in `errors` which is imported in `dotenv.ts` which is imported here.
import { config } from 'dotenv';
const { combine, timestamp, prettyPrint, colorize, errors, printf } = format;

config();

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
            timestamp.slice(14, -5)
            // first 14 chars `2022-06-30T23:`, last 5 chars `.777Z`
          }${
            level.slice(0, 9).concat(level.slice(-5)).padEnd(14)
            // 'X[32m', 'verb' + 'X[39m', only 4 chars, shortest =4.
          }: ${message}`;
        })
      ),
    }),
    // new transports.File({ filename: 'combined.log' }),
  ],
  level: process.env.LOGGER_LEVEL, // should be the only usage of nude `process.env`, for cir
  format: combine(
    errors({ stack: true }), // <-- use errors format
    timestamp(),
    prettyPrint()
  ),
});
