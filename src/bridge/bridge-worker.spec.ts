import { bridgeWorker } from './bridge-worker';

describe('singleton bridgeWorker should', () => {
  it('should load db items into queue', async () => {
    await bridgeWorker.loadUnfinishedTasksFromDb();
    console.log(bridgeWorker.size);
    expect(bridgeWorker.size).toBeGreaterThan(0);
  });

  it('throw error on double load', async () => {
    await bridgeWorker.loadUnfinishedTasksFromDb();
    const len1 = bridgeWorker.size;
    // this won't log "I run"
    // expect(async () => {
    //   await bridgeWorker.loadUnfinishedTasksFromDb();
    //   console.log('I run');
    // }).not.toThrow();
    await expect(bridgeWorker.loadUnfinishedTasksFromDb()).rejects.toThrow(
      '[BW ]: _add failed. Task existed, use _update'
    );
    const len2 = bridgeWorker.size;
    console.log('len1, len2 : ', len1, len2); // DEV_LOG_TO_REMOVE
    expect(len2).toEqual(len1);
  });

  it.skip('update tasks correctly', async () => {
    // not finished yet
    await bridgeWorker.loadUnfinishedTasksFromDb();
    await expect(bridgeWorker.updateTasksFromDb()).resolves.toBeUndefined();
    // await bridgeWorker.updateTasksFromDb();
  });

  it('should handle one task correctly', async () => {
    await bridgeWorker.loadUnfinishedTasksFromDb();
    if (bridgeWorker.size === 0) {
      console.warn('no task to handle, this test did run');
      return;
    }
    // const tasksCopy = bridgeWorker.copy;
    const taskUid = await bridgeWorker.handleOneTask();
    if (taskUid === undefined) {
      expect(bridgeWorker.size).toBe(0);
    } else {
      return;
    }
  });
});
