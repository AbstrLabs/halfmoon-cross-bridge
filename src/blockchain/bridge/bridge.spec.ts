import { KeyPair, connect, keyStores, utils } from 'near-api-js';

import { ENV } from '../../utils/dotenv';
import { GenericTxInfo } from '../..';
import { mint } from './mint-handler';
import { transferOnNearTestnetFromExampleToMaster } from './test-helpter';

const TIMEOUT_30S = 30_000;

describe('mint test', () => {
  it(
    'should mint NEAR from NEAR to ALGO',
    async () => {
      // simulate frontend: make NEAR txn
      await transferOnNearTestnetFromExampleToMaster('1');
      // manually checked the amount is correct.

      // call API
      // const from = ENV.NEAR_EXAMPL_ADDR;
      // const to = ENV.ALGO_EXAMPL_ADDR;
      // const amount = '10000000000';
      // const txId = '0x0';
      // const genericTxInfo: GenericTxInfo = {
      //   from,
      //   to,
      //   amount,
      //   txId,
      // };
      // await mint(genericTxInfo);
    },
    TIMEOUT_30S
  );
});
