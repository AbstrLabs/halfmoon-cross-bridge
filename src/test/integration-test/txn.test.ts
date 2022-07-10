import axios, { AxiosError, AxiosResponse } from 'axios';
import { PostReturn } from '../../api/algorand-near';
import { BridgeTxnSafeObj } from '../../bridge';
import { pause } from '../../utils/helper';
import { ApiCallParam, parseTxnUid } from '../../utils/type';
import { simulatedFrontendNearToGoNear } from '../test-helper/frontend-simulator-mint';

describe('Txn should ', () => {
  it('finish MINT correctly', async () => {
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

    expect(createRes.status).toBe(200);
    expect(createRes.statusText).toBe('OK');
    const createResData = createRes.data as PostReturn;
    expect(() => {
      parseTxnUid(createResData.uid);
    }).not.toThrow(); // starts with 2 digits

    // below can be a `while`, but we only running for 20 seconds.
    await pause(20_000);
    const check1Res = await axios.get(
      `http://localhost:4190/algorand-near?uid=${createResData.uid}`
    );
    const check1ResData = check1Res.data as BridgeTxnSafeObj;
    expect(check1ResData.txnStatus).not.toBe('DONE_INITIALIZE');
    if (check1ResData.txnStatus === 'DONE_OUTGOING') {
      expect(check1ResData.txnStatus).toBe('DONE_OUTGOING');
      return;
    } else {
      await pause(10_000);
      const check2Res = await axios.get(
        `http://localhost:4190/algorand-near?uid=${createResData.uid}`
      );
      const check2ResData = check2Res.data as BridgeTxnSafeObj;
      expect(check2ResData.txnStatus).toBe('DONE_OUTGOING');
      return;
    }
  }, 60_000);
  it('finish BURN correctly', async () => {
    // BURN API TEST

    //   'burn 1.2345678901 goNEAR from ALGO to NEAR',
    // async () => {
    //   // config
    //   const amount = '1.2345678901';

    //   // simulate frontend: make NEAR txn
    //   const burnResponse = await testAlgo.sendFromExampleToMaster(
    //     toGoNearAtom(amount)
    //   );
    //   // manually checked the amount is correct.
    //   const algoTxnId = burnResponse;

    //   const apiCallParam: ApiCallParam = {
    //     from: ENV.ALGO_EXAMPL_ADDR,
    //     to: ENV.NEAR_EXAMPL_ADDR,
    //     amount,
    //     txnId: algoTxnId,
    //   };

    //   // call API
    //   const bridgeTxn = await _create(apiCallParam);

    // config
    const mintAmount = '1.2345678901';

    // simulate frontend:  make NEAR mint txn
    const apiCallParam: ApiCallParam = await simulatedFrontendNearToGoNear(
      mintAmount
    );

    // same API call as frontend
    const res = await axios
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

    expect(res.status).toBe(200);
    expect(res.statusText).toBe('OK');
    const data = res.data as PostReturn;
    expect(() => {
      parseTxnUid(data.uid);
    }).not.toThrow(); // starts with 2 digits
  });
});
