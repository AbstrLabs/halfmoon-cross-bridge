// TODO: Add logger level to .env

/* This file is an logger interface */
// UNRESOLVED: https://github.com/facebook/jest/issues/8790

import { createLogger, format, transports } from 'winston';

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
        printf(({ level, message, timestamp }) => {
          return `${timestamp} ${level.padEnd(7, ' ')}: ${message}`;
        })
      ),
    }),
    // new transports.File({ filename: 'combined.log' }),
  ],
  level: 'info',
  format: combine(
    errors({ stack: true }), // <-- use errors format
    timestamp(),
    prettyPrint()
  ),
});
