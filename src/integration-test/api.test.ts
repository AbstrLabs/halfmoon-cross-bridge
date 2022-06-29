import { IncomingMessage, request, RequestOptions } from 'node:http';
import { WELCOME_JSON } from '../server';

it('hosted API server returns welcome JSON on GET', async () => {
  //
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  // expect((await res.json()).API_VERSION == '0.1.1').toBe(true);
  let message: string | undefined = undefined;
  await new Promise((resolve) => {
    const reqCb = (res: IncomingMessage) => {
      expect(res.statusCode).toBe(200);
      expect(res.statusMessage).toBe('OK');
      // console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      res.on('data', (chunk: Buffer) => {
        if (message !== undefined) {
          console.warn('received more than one chunk');
        }
        message = chunk.toString('utf8');
      });
      res.on('end', () => {
        if (message === undefined) {
          console.error('no message received');
          throw Error('no message received');
        }
        expect(JSON.parse(message)).toStrictEqual(WELCOME_JSON);
        resolve(null);
      });
    };

    const reqOpt: RequestOptions = {
      host: 'localhost',
      port: 4190,
      method: 'GET',
    };
    const req = request(reqOpt, reqCb);
    req.end();
  });
});

// it('/algorand-near creates transaction in database on POST', async () => {

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
