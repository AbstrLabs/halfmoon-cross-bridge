// TODO: mint-burn-test: move more same functions to test helper.

import { NearTxnId, TxnType } from '../blockchain';

import { ApiCallParam } from '../utils/type';
import { ENV } from '../utils/dotenv';
import { FinalExecutionOutcome } from 'near-api-js/lib/providers';
import { testAlgo } from '../blockchain/algorand';
import { toGoNearAtom } from '../utils/formatter';
import { create } from './transact';
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
      let mintResponse: FinalExecutionOutcome | undefined = undefined;
      let nearTxnId: NearTxnId | undefined = undefined;
      try {
        mintResponse = await transferOnNearTestnetFromExampleToMaster(amount);
        // TODO(#TNFT): Type FinalExecutionOutcome.transaction.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment
        nearTxnId = mintResponse.transaction.hash as NearTxnId; // or mintResponse.transaction_outcome.id;
      } catch (err) {
        console.error('cannot mint NEAR', err);
      }
      // manually checked the amount is correct.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access

      if (!nearTxnId) {
        throw new Error('cannot mint NEAR');
      }
      const apiCallParam: ApiCallParam = {
        type: TxnType.MINT,
        from: ENV.NEAR_EXAMPL_ADDR,
        to: ENV.ALGO_EXAMPL_ADDR,
        amount,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        txnId: nearTxnId,
      };

      // call API
      const bridgeTxn = await create(apiCallParam);
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
        type: TxnType.BURN,
        from: ENV.ALGO_EXAMPL_ADDR,
        to: ENV.NEAR_EXAMPL_ADDR,
        amount,
        txnId: algoTxnId,
      };

      // call API
      const bridgeTxn = await create(apiCallParam);
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
