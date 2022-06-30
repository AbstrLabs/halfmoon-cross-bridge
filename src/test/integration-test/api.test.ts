import axios, { AxiosError, AxiosResponse } from 'axios';
import { WELCOME_JSON } from '../../server';
import { PostReturn } from '../../server/algorand-near';
import { MintApiParam, parseTxnUid } from '../../utils/type';
import { simulatedFrontendNearToGoNear } from '../test-helper/frontend-simulator-mint';

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

// });

// const resp = await request("/", {
//   method: 'POST',
//   mode: 'cors',
//   body: JSON.stringify(postParam),
//   headers: {
//     'Content-Type': 'application/json',
//     'Content-Length': `${Buffer.byteLength(JSON.stringify(postParam))}`,
//   },
// });
