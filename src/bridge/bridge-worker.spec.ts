import { BridgeTxnStatusTree } from '..';
import { bridgeWorker } from './bridge-worker';

beforeEach(() => {
  bridgeWorker._test_dropAll();
});

describe('singleton bridgeWorker should', () => {
  it('should load db items into queue', async () => {
    await bridgeWorker.loadUnfinishedTasksFromDb();
    console.log(bridgeWorker.size);
    expect(bridgeWorker.size).toBeGreaterThan(0);
  });

  it('throw error on double load', async () => {
    await bridgeWorker.loadUnfinishedTasksFromDb();
    const len1 = bridgeWorker.size;
    // this won't log "I run" and won't run.
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

  it('handle one task correctly', async () => {
    await bridgeWorker.loadUnfinishedTasksFromDb();
    if (bridgeWorker.size === 0) {
      console.warn('no task to handle, this test did run');
      // should tell how to create an unfinished task
      expect(true).toBeTruthy();
      return;
    }
    const oldCopy = bridgeWorker._test_copy;
    const taskUid = await bridgeWorker.handleOneTask();
    const newCopy = bridgeWorker._test_copy;
    if (taskUid === undefined) {
      expect(taskUid).toBeDefined();
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
      console.log(`task [${taskUid}] is done, removed from queue`);
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
