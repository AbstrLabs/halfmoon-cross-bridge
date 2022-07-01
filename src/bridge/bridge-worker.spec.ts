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
    console.log('len1 : ', len1);
    await bridgeWorker.loadUnfinishedTasksFromDb();
    const len2 = bridgeWorker.length;
    console.log('len2 : ', len2);
    expect(len2).toEqual(len1);
  });

  it('should load db items into queue', async () => {
    await bridgeWorker.loadUnfinishedTasksFromDb();
    await bridgeWorker.handleNewTask();
    expect(bridgeWorker.length).toBeGreaterThan(0);
  });
});
