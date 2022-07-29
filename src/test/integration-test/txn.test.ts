import axios, { AxiosError, AxiosResponse } from 'axios';
import { PostReturn } from '../../api/routes/txn-route';
import { testAlgo } from '../../blockchain/algorand';
import { BridgeTxnSafeObj } from '../../bridge';
import { ENV } from '../../utils/env';
import { toGoNearAtom } from '../../utils/formatter';
import { pause } from '../../utils/helper';
import { TokenId } from '../../common/src/type/token';
import { simulatedFrontendNearToGoNear } from '../test-helper/frontend-simulator-mint';
import { ApiCallParam } from '../../common/src/type/api';
import { parseTxnUid } from '../../common/src/type/cross-module';
import { inspect } from 'util';

const SECOND = 1000;
const TXN_CREATION_TIME = 15 * SECOND;
const TXN_EXECUTION_TIME = 60 * SECOND; // from create to finish
const TEST_TIME_LIMIT = TXN_CREATION_TIME + TXN_EXECUTION_TIME + 15 * SECOND;
describe('Txn should', () => {
  it(
    'execute whole MINT correctly',
    async () => {
      // config
      const mintAmount = '1.2345678901';

      // simulate frontend:  make NEAR mint txn
      const apiCallParam: ApiCallParam = await simulatedFrontendNearToGoNear(
        mintAmount
      );

      // same API call as frontend
      const createRes = await axios
        .post('http://localhost:4190/algorand-near', {
          ...apiCallParam,
        })
        .catch((err: AxiosError) => {
          if (axios.isAxiosError(err)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const res: AxiosResponse = err.response!;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { data, status, headers } = res;
            console.error(
              `{data: ${
                data as string
              }, status: ${status}, headers: ${JSON.stringify(headers)}}`
            );
          }
          throw err;
        });

      await testOfPost(createRes);
    },
    TEST_TIME_LIMIT
  );
  it(
    'execute whole BURN correctly',
    async () => {
      // config
      const burnAmount = '1.2345678901';

      // simulate frontend:  make NEAR BURN txn

      const burnResponse = await testAlgo.sendFromExampleToMaster(
        toGoNearAtom(burnAmount)
      );
      const algoBurnTxnId = burnResponse;

      const apiCallParam: ApiCallParam = {
        from_addr: ENV.ALGO_EXAMPL_ADDR,
        to_addr: ENV.NEAR_EXAMPL_ADDR,
        amount: burnAmount,
        from_token: TokenId.goNEAR,
        to_token: TokenId.NEAR,
        txn_id: algoBurnTxnId,
      };

      // same API call as frontend
      const createRes = await axios
        .post('http://localhost:4190/algorand-near', {
          ...apiCallParam,
        })
        .catch((err: AxiosError) => {
          if (axios.isAxiosError(err)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const res: AxiosResponse = err.response!;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { data, status, headers } = res;
            console.error(
              `{data: ${
                data as string
              }, status: ${status}, headers: ${JSON.stringify(
                inspect(headers)
              )}}`
            );
          }
          throw err;
        });

      await testOfPost(createRes);
    },
    TEST_TIME_LIMIT
  );
});

async function testOfPost(createRes: AxiosResponse) {
  // check if post is success
  // TODO: ren createRes -> postRes
  expect(createRes.status).toBe(200);
  expect(createRes.statusText).toBe('OK');
  const createResData = createRes.data as PostReturn;
  expect(() => {
    parseTxnUid(createResData.uid);
  }).not.toThrow(); // starts with 2 digits //+ LION doesn't see where "2 digits" is from

  // maybe use a `while` below, and check status after N rounds

  // check if txn is started to execute after TXN_CREATION_TIME
  await pause(TXN_CREATION_TIME);
  // TODO: ren check1Res -> get1Res
  const check1Res = await axios.get(
    `http://localhost:4190/algorand-near?uid=${createResData.uid}`
  );
  const check1ResData = check1Res.data as BridgeTxnSafeObj;
  expect(check1ResData.txnStatus).not.toBe('DONE_INITIALIZE');

  // check if txn is finished after TXN_EXECUTION_TIME
  if (check1ResData.txnStatus === 'DONE_OUTGOING') {
    expect(check1ResData.txnStatus).toBe('DONE_OUTGOING');
    return;
  } else {
    await pause(TXN_EXECUTION_TIME);
    const check2Res = await axios.get(
      `http://localhost:4190/algorand-near?uid=${createResData.uid}`
    );
    const check2ResData = check2Res.data as BridgeTxnSafeObj;
    expect(check2ResData.txnStatus).toBe('DONE_OUTGOING');
    return;
  }
}
