import { bridgeWorker } from './bridge-worker';

describe('singleton txnHandler', () => {
  it('should load db items into queue', async () => {
    await bridgeWorker.loadUnfinishedTasksFromDb();
    expect(bridgeWorker.length).toBeGreaterThan(0);
  });
});
