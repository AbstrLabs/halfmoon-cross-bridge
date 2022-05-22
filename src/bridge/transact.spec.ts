// TODO: mint-burn-test: move more same functions to test helper.

import { ApiCallParam } from '../utils/type';
import { ENV } from '../utils/dotenv';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';
import { TxnType } from '../blockchain';
import { transact } from './transact';
import { transferOnNearTestnetFromExampleToMaster } from './test-helper';

const TIMEOUT_30S = 30_000;

describe('mint test', () => {
  it(
    'mint 1.2345678901 NEAR from NEAR to ALGO',
    async () => {
      // suppose Opted-in to goNEAR.

      // config
      const amount = '1.2345678901';
      // simulate frontend: make NEAR txn
      const mintResponse: FinalExecutionOutcome =
        await transferOnNearTestnetFromExampleToMaster(amount);
      // manually checked the amount is correct.
      const nearTxnId = mintResponse.transaction.hash; // or mintResponse.transaction_outcome.id;

      const apiCallParam: ApiCallParam = {
        txnType: TxnType.MINT,
        from: ENV.NEAR_EXAMPL_ADDR,
        to: ENV.ALGO_EXAMPL_ADDR,
        amount,
        txnId: nearTxnId,
      };

      // call API
      const bridgeTxn = await transact(apiCallParam);
      // should return AlgoTxnId,etc.

      // console.log('bridgeTxn : ', bridgeTxn);
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
