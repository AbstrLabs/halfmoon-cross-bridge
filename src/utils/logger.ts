// This file is an logger interface
// options: winston / morgan
import { createLogger, format, transports, default as winston } from 'winston';

const { combine, timestamp, prettyPrint, colorize, errors } = format;

export { log, logger };
function log(...args: any): void {
  logger.info({ ...args });
}

const logger = createLogger({
  transports: [
    new transports.Console(),
    // new transports.File({ filename: 'combined.log' }),
  ],
  format: combine(
    errors({ stack: true }), // <-- use errors format
    colorize(),
    timestamp(),
    prettyPrint()
  ),
});