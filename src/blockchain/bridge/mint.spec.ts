// TODO: mint-burn-test: move more same functions to test helper.
// TODO: test with <1 NEAR should all fail now (for fee).

import { ApiCallParam } from '../..';
import { ENV } from '../../utils/dotenv';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';
import { db } from '../../database';
import { mint } from './mint';
import { transferOnNearTestnetFromExampleToMaster } from './test-helper';

const TIMEOUT_30S = 30_000;

describe('mint test', () => {
  beforeAll(async () => {
    await db.connect();
  });
  afterAll(async () => {
    await db.end();
  });
  // TODO: should in near test.
  // it.skip('transfer 0.123 Near from example to master', async () => {});
  it(
    'mint 1.2345678901 NEAR from NEAR to ALGO',
    async () => {
      // suppose Opted-in to goNEAR.

      // config
      const amount = '1.2345678901';
      // TODO: not uuid some blockchain doesn't have the note field.
      // simulate frontend: make NEAR txn
      const mintResponse: FinalExecutionOutcome =
        await transferOnNearTestnetFromExampleToMaster(amount);
      // manually checked the amount is correct.
      const nearTxnId = mintResponse.transaction.hash; // or mintResponse.transaction_outcome.id;

      const apiCallParam: ApiCallParam = {
        from: ENV.NEAR_EXAMPL_ADDR,
        to: ENV.ALGO_EXAMPL_ADDR,
        amount,
        txnId: nearTxnId,
      };

      // call API
      const bridgeTxn = await mint(apiCallParam);
      // should return AlgoTxnId,etc.

      console.log('bridgeTxn : ', bridgeTxn);
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
