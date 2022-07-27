import axios, { AxiosError, AxiosResponse } from 'axios';
import { PostReturn } from '../../api/routes/txn-route';
import { testAlgo } from '../../blockchain/algorand';
import { BridgeTxnSafeObj } from '../../bridge';
import { ENV } from '../../utils/dotenv';
import { toGoNearAtom } from '../../utils/formatter';
import { pause } from '../../utils/helper';
import { TokenId } from '../../common/src/type/token';
import { ApiCallParam, parseTxnUid } from '../../utils/type/type';
import { simulatedFrontendNearToGoNear } from '../test-helper/frontend-simulator-mint';

describe('Txn should', () => {
  it('execute whole MINT correctly', async () => {
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

    // TODO: REF-POST-START
    expect(createRes.status).toBe(200);
    expect(createRes.statusText).toBe('OK');
    const createResData = createRes.data as PostReturn;
    expect(() => {
      parseTxnUid(createResData.uid);
    }).not.toThrow(); // starts with 2 digits

    // below can be a `while`, but we only running for 20 seconds.
    await pause(25_000);
    const check1Res = await axios.get(
      `http://localhost:4190/algorand-near?uid=${createResData.uid}`
    );
    const check1ResData = check1Res.data as BridgeTxnSafeObj;
    expect(check1ResData.txnStatus).not.toBe('DONE_INITIALIZE');
    if (check1ResData.txnStatus === 'DONE_OUTGOING') {
      expect(check1ResData.txnStatus).toBe('DONE_OUTGOING');
      return;
    } else {
      await pause(15_000);
      const check2Res = await axios.get(
        `http://localhost:4190/algorand-near?uid=${createResData.uid}`
      );
      const check2ResData = check2Res.data as BridgeTxnSafeObj;
      expect(check2ResData.txnStatus).toBe('DONE_OUTGOING');
      return;
    }
    // TODO: REF-POST-END
  }, 60_000);
  it('execute whole BURN correctly', async () => {
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
            }, status: ${status}, headers: ${JSON.stringify(headers)}}`
          );
        }
        throw err;
      });

    // TODO: REF-POST-START
    expect(createRes.status).toBe(200);
    expect(createRes.statusText).toBe('OK');
    const createResData = createRes.data as PostReturn;
    expect(() => {
      parseTxnUid(createResData.uid);
    }).not.toThrow(); // starts with 2 digits

    // below can be a `while`, but we only running for 20 seconds.
    await pause(25_000);
    const check1Res = await axios.get(
      `http://localhost:4190/algorand-near?uid=${createResData.uid}`
    );
    const check1ResData = check1Res.data as BridgeTxnSafeObj;
    expect(check1ResData.txnStatus).not.toBe('DONE_INITIALIZE');
    if (check1ResData.txnStatus === 'DONE_OUTGOING') {
      expect(check1ResData.txnStatus).toBe('DONE_OUTGOING');
      return;
    } else {
      await pause(15_000);
      const check2Res = await axios.get(
        `http://localhost:4190/algorand-near?uid=${createResData.uid}`
      );
      const check2ResData = check2Res.data as BridgeTxnSafeObj;
      expect(check2ResData.txnStatus).toBe('DONE_OUTGOING');
      return;
    }
    // TODO: REF-POST-END
  }, 60_000);
});
