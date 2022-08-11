const { createLogger, format, transports } = require('winston');

const level = process.env.LOGGER_LEVEL ?? 'info';

module.exports = createLogger({
    level,
    format: format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      format.errors({ stack: true }),
      format.colorize(),
      format.simple()
    ),
    transports: [new transports.Console()]
});
