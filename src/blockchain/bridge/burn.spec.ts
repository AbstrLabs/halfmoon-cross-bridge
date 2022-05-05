// TODO: mint-burn-test: move more same functions to test helper.

import { ApiCallParam } from '../..';
import { ENV } from '../../utils/dotenv';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';
import { burn } from './burn';
import { db } from '../../database';
import { goNearToAtom } from '../../utils/formatter';
import { mint } from './mint';
import { testAlgo } from '../algorand';
import { transferOnNearTestnetFromExampleToMaster } from './test-helper';

const TIMEOUT_30S = 30_000;

describe('burn test', () => {
  beforeAll(async () => {
    await db.connect();
  });
  afterAll(async () => {
    await db.end();
  });
  // TODO: should in near test.
  // it.skip('transfer 0.123 Near from example to master', async () => {});
  it(
    'mint 2.345678901 NEAR from NEAR to ALGO',
    async () => {
      // config
      const amount = '2.345678901';

      // simulate frontend: make NEAR txn
      // TODO: return txnId is nice. Should do the same on mint.
      const burnResponse = await testAlgo.sendFromExampleToMaster(
        goNearToAtom(amount)
      );
      // manually checked the amount is correct.
      const algoTxnId = burnResponse;

      const apiCallParam: ApiCallParam = {
        from: ENV.ALGO_EXAMPL_ADDR,
        to: ENV.NEAR_EXAMPL_ADDR,
        amount,
        txnId: algoTxnId,
      };

      // call API
      const bridgeTxnInfo = await burn(apiCallParam);
      console.log('bridgeTxnInfo : ', bridgeTxnInfo); // DEV_LOG_TO_REMOVE

      // should return AlgoTxnId,etc.

      console.log('bridgeTxnInfo : ', bridgeTxnInfo); // DEV_LOG_TO_REMOVE
      // verification
      expect(bridgeTxnInfo.toTxnId).toBeDefined();
    },
    TIMEOUT_30S * 3
  );
  /* TODO: More tests:
   * - wrong amount,
   * - wrong txnId
   * - malformed address
   * - timeout (?override with jest?)
   */
});
