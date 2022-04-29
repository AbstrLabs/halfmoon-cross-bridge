import { logger } from './logger';

describe('utils tool test, should skip', () => {
  describe('logger', () => {
    it('log "something"', () => {
      logger.info('something');
      console.log('something'); // this is better to show call stack
    });
  });
});
