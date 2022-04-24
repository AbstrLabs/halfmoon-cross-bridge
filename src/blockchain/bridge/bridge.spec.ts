import { KeyPair, connect, keyStores, utils } from 'near-api-js';

import { ENV } from '../../utils/dotenv';
import { GenericTxInfo } from '../..';
import { db } from '../../database';
import { mint } from './mint-handler';
import { transferOnNearTestnetFromExampleToMaster } from './test-helpter';

const TIMEOUT_30S = 30_000;

describe('mint test', () => {
  beforeAll(async () => {
    await db.connect();
  });
  afterAll(async () => {
    await db.end();
  });
  it(
    'mint NEAR from NEAR to ALGO',
    async () => {
      // simulate frontend: make NEAR txn
      const mintResponse = await transferOnNearTestnetFromExampleToMaster('1');
      // manually checked the amount is correct.
      console.log('mintResponse : ', mintResponse); // DEV_LOG_TO_REMOVE
      const nearTxId = mintResponse.transaction.hash; // or mintResponse.transaction_outcome.id;

      const genericTxInfo: GenericTxInfo = {
        from: ENV.NEAR_EXAMPL_ADDR,
        to: ENV.ALGO_EXAMPL_ADDR,
        amount: '1',
        txId: nearTxId,
      };

      // call API
      const bridgeTxInfo = await mint(genericTxInfo);
      // should return AlgoTxId,etc.

      console.log('bridgeTxInfo : ', bridgeTxInfo); // DEV_LOG_TO_REMOVE
      // verification
      expect(bridgeTxInfo.toTxId).toBeDefined();
    },
    TIMEOUT_30S
  );
});
