// This file is an logger interface
// options: winston / morgan
import { createLogger, format, transports, default as winston } from 'winston';

const { combine, timestamp, prettyPrint, colorize, errors } = format;

export { logger };

const logger = createLogger({
  transports: [
    new transports.Console(),
    // new transports.File({ filename: 'combined.log' }),
  ],
  level: 'debug',
  format: combine(
    errors({ stack: true }), // <-- use errors format
    colorize(),
    timestamp(),
    prettyPrint()
  ),
});
