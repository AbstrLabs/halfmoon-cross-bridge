import { logger } from './logger';

describe('logger', () => {
  it('should log messages at correct logger levels', () => {
    logger.error('logger with level "error"');
    logger.warn('logger with level "warn"');
    logger.info('logger with level "info"');
    logger.http('logger with level "http"');
    logger.verbose('logger with level "verbose"');
    logger.debug('logger with level "debug"');
    logger.silly('logger with level "silly"');
    console.log('log from console.log, with better call stack');
  });
});
