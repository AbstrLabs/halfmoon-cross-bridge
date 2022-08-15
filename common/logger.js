const { createLogger, format, transports } = require('winston');

const level = process.env.LOGGER_LEVEL ?? 'info';

module.exports = createLogger({
    level,
    format: format.combine(
      format.timestamp(),
      format.errors({stack: true})
    ),
    transports: [new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, label, timestamp }) => {
          return `${timestamp} ${label ? "[" + label + "] " : ''}${level}: ${message}`;
        })
      )
    })]
});
