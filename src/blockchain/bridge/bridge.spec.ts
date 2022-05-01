import { ApiCallParam } from '../..';
import { ENV } from '../../utils/dotenv';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';
import { db } from '../../database';
import { mint } from './mint-handler';
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
    'mint 0.424 NEAR from NEAR to ALGO',
    async () => {
      // config
      const amount = '0.424';

      // simulate frontend: make NEAR txn
      const mintResponse: FinalExecutionOutcome =
        await transferOnNearTestnetFromExampleToMaster(amount);
      // manually checked the amount is correct.
      const nearTxnId = mintResponse.transaction.hash; // or mintResponse.transaction_outcome.id;

      const apiCallParam: ApiCallParam = {
        from: ENV.NEAR_EXAMPL_ADDR,
        to: ENV.ALGO_EXAMPL_ADDR,
        amount,
        txId: nearTxnId,
      };

      // call API
      const bridgeTxnInfo = await mint(apiCallParam);
      // should return AlgoTxnId,etc.

      console.log('bridgeTxnInfo : ', bridgeTxnInfo); // DEV_LOG_TO_REMOVE
      // verification
      expect(bridgeTxnInfo.toTxnId).toBeDefined();
    },
    TIMEOUT_30S
  );
  /* TODO: More tests:
   * - wrong amount,
   * - wrong txId
   * - malformed address
   * - timeout (?override with jest?)
   */
});
