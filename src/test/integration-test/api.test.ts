import axios, { AxiosError, AxiosResponse } from 'axios';
import { BridgeTxn } from '../../bridge';
import { WELCOME_JSON } from '../../api';
import { PostReturn } from '../../api/algorand-near';
import { MintApiParam, parseTxnUid } from '../../utils/type';
import {
  EXAMPLE_MALFORMED_UID_FROM_DB,
  EXAMPLE_TXN_FROM_DB,
} from '../test-helper/test-examples';
import { simulatedFrontendNearToGoNear } from '../test-helper/frontend-simulator-mint';

describe('root API (GET)', () => {
  it('hosted API root server returns welcome JSON on GET', async () => {
    const res = await axios.get('http://localhost:4190/');

    const IGNORED = 'IGNORED';
    interface shaped {
      ADDITIONAL_INFO: { SERVER_UP_TIMESTAMP: string };
    }
    (res.data as shaped).ADDITIONAL_INFO.SERVER_UP_TIMESTAMP = IGNORED;
    (WELCOME_JSON as shaped).ADDITIONAL_INFO.SERVER_UP_TIMESTAMP = IGNORED;
    expect(res.data).toStrictEqual(WELCOME_JSON);
    expect(res.status).toBe(200);
    expect(res.statusText).toBe('OK');
  });
});

describe('/algorand-near API (GET)', () => {
  it('/algorand-near returns welcome JSON on no-param GET', async () => {
    const res = await axios.get('http://localhost:4190/algorand-near');

    const IGNORED = 'IGNORED';
    interface shaped {
      ADDITIONAL_INFO: { SERVER_UP_TIMESTAMP: string };
    }
    (res.data as shaped).ADDITIONAL_INFO.SERVER_UP_TIMESTAMP = IGNORED;
    (WELCOME_JSON as shaped).ADDITIONAL_INFO.SERVER_UP_TIMESTAMP = IGNORED;
    expect(res.data).toStrictEqual(WELCOME_JSON);
    expect(res.status).toBe(200);
    expect(res.statusText).toBe('OK');
  });

  it('/algorand-near returns welcome JSON on VALID-param-ed GET', async () => {
    const res = await axios.get(
      'http://localhost:4190/algorand-near?uid=' +
        BridgeTxn.fromObject(EXAMPLE_TXN_FROM_DB).uid
    );

    expect(res.data).toStrictEqual(EXAMPLE_TXN_FROM_DB);
    expect(res.status).toBe(200);
    expect(res.statusText).toBe('OK');
  });

  it('/algorand-near returns 406 invalid-param-ed GET', async () => {
    // TODO: [TEST-CONST]

    await expect(
      axios.get(
        'http://localhost:4190/algorand-near?uid=' +
          EXAMPLE_MALFORMED_UID_FROM_DB
      )
    ).rejects.toThrowError(
      new AxiosError('Request failed with status code 406')
    );
  });
});

describe('/algorand-near API (POST)', () => {
  it('/algorand-near creates transaction in database on POST', async () => {
    // config
    const amount = '1.2345678901';

    // simulate frontend:  make NEAR mint txn
    const mintApiParam: MintApiParam = await simulatedFrontendNearToGoNear(
      amount
    );

    // same API call as frontend
    const res = await axios
      .post('http://localhost:4190/algorand-near', {
        ...mintApiParam,
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
    console.log(data);
    expect(() => {
      parseTxnUid(data.uid);
    }).not.toThrow(); // starts with 2 digits
  });

  /* TODO: More tests:
   * - wrong amount,
   * - wrong txnId
   * - malformed address
   * - timeout (?override with jest?)
   */

  // test('API endpoint should reject double mint', async ({ request }) => {
  //   const res = await request.post('./algorand-near', { data: {} });
  //   expect(res.ok()).toBeTruthy();
  //   console.dir(await res.json());
  // });
  // test('API endpoint should reject old transactions', async ({ request }) => {
  //   const res = await request.post('./algorand-near', { data: {} });
  //   expect(res.ok()).toBeTruthy();
  //   console.dir(await res.json());
  // });

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
  //     type: TxnType.BURN,
  //     from: ENV.ALGO_EXAMPL_ADDR,
  //     to: ENV.NEAR_EXAMPL_ADDR,
  //     amount,
  //     txnId: algoTxnId,
  //   };

  //   // call API
  //   const bridgeTxn = await _create(apiCallParam);
});
