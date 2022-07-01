import { bridgeWorker } from './bridge-worker';

describe('singleton txnHandler', () => {
  it('should load db items into queue', async () => {
    await bridgeWorker.loadUnfinishedTasksFromDb();
    console.log(bridgeWorker.length);
    expect(bridgeWorker.length).toBeGreaterThan(0);
  });

  it('double load will not cause repetition ', async () => {
    await bridgeWorker.loadUnfinishedTasksFromDb();
    const len1 = bridgeWorker.length;
    await bridgeWorker.loadUnfinishedTasksFromDb();
    const len2 = bridgeWorker.length;
    expect(len2).toEqual(len1);
  });

  it('should handle one task correctly', async () => {
    await bridgeWorker.loadUnfinishedTasksFromDb();
    console.log('bridgeWorker.length : ', bridgeWorker.length); // DEV_LOG_TO_REMOVE
    await bridgeWorker.handleOneTask();
    expect(bridgeWorker.length).toBeGreaterThan(0);
  });
});
