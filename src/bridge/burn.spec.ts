// TODO: mint-burn-test: move more same functions to test helper.

import { ApiCallParam } from '../utils/type';
import { ENV } from '../utils/dotenv';
import { TxnType } from '../blockchain';
import { burn } from './burn';
import { testAlgo } from '../blockchain/algorand';
import { toGoNearAtom } from '../utils/formatter';

const TIMEOUT_30S = 30_000;

describe('burn test', () => {
  it(
    'burn 1.2345678901 goNEAR from ALGO to NEAR',
    async () => {
      // config
      const amount = '1.2345678901';

      // simulate frontend: make NEAR txn
      const burnResponse = await testAlgo.sendFromExampleToMaster(
        toGoNearAtom(amount)
      );
      // manually checked the amount is correct.
      const algoTxnId = burnResponse;

      const apiCallParam: ApiCallParam = {
        txnType: TxnType.BURN,
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
