// TODO: Add logger level to .env
// This file is an logger interface

import { createLogger, format, transports } from 'winston';

const { combine, timestamp, prettyPrint, colorize, errors } = format;

export { logger };

const logger = createLogger({
  transports: [
    new transports.Console(),
    // new transports.File({ filename: 'combined.log' }),
  ],
  level: 'info',
  format: combine(
    errors({ stack: true }), // <-- use errors format
    colorize(),
    timestamp(),
    prettyPrint()
  ),
});
