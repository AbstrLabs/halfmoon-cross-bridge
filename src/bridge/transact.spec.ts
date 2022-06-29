// TODO: mint-burn-test: move more same functions to test helper.

import { TxnType } from '../blockchain';

import { ApiCallParam } from '../utils/type';
import { ENV } from '../utils/dotenv';
import { testAlgo } from '../blockchain/algorand';
import { toGoNearAtom } from '../utils/formatter';
import { _create } from './transact';
import { simulatedFrontendNearToGoNear } from '../test/test-helper/frontend-simulator-mint';

const TIMEOUT_30S = 30_000;

describe.skip('mint test', () => {
  // skipped for state pattern
  it(
    'mint 1.2345678901 NEAR from NEAR to ALGO',
    // suppose Opted-in to goNEAR.
    async () => {
      // config
      const amount = '1.2345678901';

      // simulate frontend
      const apiCallParam: ApiCallParam = await simulatedFrontendNearToGoNear(
        amount
      );

      // call API
      const bridgeTxn = await _create(apiCallParam);
      const bridgeTxnObject = await bridgeTxn.runWholeBridgeTxn();
      // should return AlgoTxnId,etc.

      // verification
      expect(bridgeTxnObject.toTxnId).toBeDefined();
    },
    TIMEOUT_30S
  );
  /* TODO: More tests:
   * - wrong amount,
   * - wrong txnId
   * - malformed address
   * - timeout (?override with jest?)
   */
});

// TODO: mint-burn-test: move more same functions to test helper.

describe.skip('burn test', () => {
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
        type: TxnType.BURN,
        from: ENV.ALGO_EXAMPL_ADDR,
        to: ENV.NEAR_EXAMPL_ADDR,
        amount,
        txnId: algoTxnId,
      };

      // call API
      const bridgeTxn = await _create(apiCallParam);
      const bridgeTxnObject = await bridgeTxn.runWholeBridgeTxn();

      // should return AlgoTxnId,etc.

      // verification
      expect(bridgeTxnObject.toTxnId).toBeDefined();
    },
    TIMEOUT_30S
  );
  /* TODO: More tests:
   * - wrong amount,
   * - wrong txnId
   * - malformed address
   * - timeout (?override with jest?)
   */
});
