// TODO: mint-burn-test: move more same functions to test helper.

import { ApiCallParam } from '../..';
import { ENV } from '../../utils/dotenv';
import { burn } from './burn';
import { db } from '../../database/db';
import { goNearToAtom } from '../../utils/formatter';
import { testAlgo } from '../algorand';

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
    'burn 1.2345678901 goNEAR from ALGO to NEAR',
    async () => {
      // config
      const amount = '1.2345678901';

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
      const bridgeTxn = await burn(apiCallParam);

      // should return AlgoTxnId,etc.

      // verification
      expect(bridgeTxn.toTxnId).toBeDefined();
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
