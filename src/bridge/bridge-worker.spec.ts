import { txnHandler } from './bridge-worker';

describe('singleton txnHandler', () => {
  it('should load db items into queue', async () => {
    await txnHandler.loadUnfinishedTasksFromDb();
    expect(txnHandler.length).toBeGreaterThan(0);
  });
});
