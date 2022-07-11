import { BridgeTxnStatusTree } from '..';
import { bridgeWorker, FetchAction } from './bridge-worker';

beforeEach(() => {
  bridgeWorker._test_dropAll();
});

describe('singleton bridgeWorker should', () => {
  it('should load db items into queue', async () => {
    expect(+bridgeWorker.lastFetchingTime).toBe(0);
    await bridgeWorker.fetchTasksFromDb(FetchAction.LOAD);
    expect(+bridgeWorker.lastFetchingTime).toBeGreaterThan(Date.now() - 15_000); // This can be 0 when no items in db
  });

  it('throw error on double load', async () => {
    await bridgeWorker.fetchTasksFromDb(FetchAction.LOAD);
    const len1 = bridgeWorker.size;
    const time1 = +bridgeWorker.lastFetchingTime;
    if (len1 !== 0) {
      await expect(
        bridgeWorker.fetchTasksFromDb(FetchAction.LOAD)
      ).rejects.toThrow('[BW ]: _add failed. Task existed, use _update');
    }
    const len2 = bridgeWorker.size;
    const time2 = +bridgeWorker.lastFetchingTime;
    expect(len2).toBeGreaterThanOrEqual(len1);
    expect(time2).toBeGreaterThanOrEqual(time1);

    // this won't log "I run" and won't run.
    // expect(async () => {
    //   await bridgeWorker.loadUnfinishedTasksFromDb();
    //   console.log('I run');
    // }).not.toThrow();
  });

  it('update tasks correctly', async () => {
    // not finished yet
    await bridgeWorker.fetchTasksFromDb(FetchAction.LOAD);
    await expect(
      bridgeWorker.fetchTasksFromDb(FetchAction.UPDATE)
    ).resolves.toBeUndefined();
    // await bridgeWorker.updateTasksFromDb();
  });

  it('handle one task correctly', async () => {
    await bridgeWorker.fetchTasksFromDb(FetchAction.LOAD);
    if (bridgeWorker.size === 0) {
      console.warn('no task to handle, this test did run');
      // should tell how to create an unfinished task
      expect(true).toBeTruthy();
      return;
    }
    const oldCopy = bridgeWorker._test_copy;
    const taskUid = await bridgeWorker.handleOneTask();
    const newCopy = bridgeWorker._test_copy;
    expect(taskUid).toBeDefined();
    if (taskUid === undefined) {
      return;
    }
    const oldTask = oldCopy.get(taskUid);
    const newTask = newCopy.get(taskUid);

    if (oldTask === undefined) {
      expect(oldTask).toBeDefined();
      return;
    }
    if (newTask === undefined) {
      // meaning this job is done, removed from queue
      console.info(`task [${taskUid}] is done, removed from queue`);
      expect(true).toBeTruthy();
    } else {
      expect(newTask.txnStatus).not.toEqual(oldTask.txnStatus);
      // TODO: [BTST]: have a getPrev() for BridgeTxnStatusTree
      const prev1 = BridgeTxnStatusTree[newTask.txnStatus].previous;
      const prev2 = prev1 ? BridgeTxnStatusTree[prev1].previous : null;
      expect([prev1, prev2].includes(oldTask.txnStatus)).toBe(true);
    }
  });
});
