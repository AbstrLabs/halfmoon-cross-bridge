import { newLog } from './log-template';

describe('log proxy should', () => {
  it('should return function', () => {
    const ll = newLog.MAIN.loggerLevel;
    newLog.MA.G;
    expect(ll).toBeInstanceOf(Function);
    ll();
    ll();
    ll();
  });
});
