import { newLog } from './log-template';

describe('log proxy should', () => {
  it('should return function (being called 3 times)', () => {
    const ll = newLog.MAIN.loggerLevel;
    expect(ll).toBeInstanceOf(Function);
    ll();
    ll();
    ll();
  });
});
