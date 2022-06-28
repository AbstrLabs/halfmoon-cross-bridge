import { IncomingMessage, request, RequestOptions } from 'node:http';

it('host API server', async () => {
  // expect(res.statusMessage).toBeTruthy();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  // expect((await res.json()).API_VERSION == '0.1.1').toBe(true);
  await new Promise((resolve) => {
    const reqOpt: RequestOptions = {
      // host: '',
      method: 'GET',
    };
    const req = request(
      'http://localhost:4190/',
      reqOpt,
      (res: IncomingMessage) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        console.log(`STATUS: ${res.statusCode!.toString()}`);
        console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          console.log(`BODY: ${chunk}`);
        });
        res.on('end', () => {
          console.log('No more data in response.');
          resolve(null);
        });
      }
    );

    req.end();
  });
});

// const resp = await request("/", {
//   method: 'POST',
//   mode: 'cors',
//   body: JSON.stringify(postParam),
//   headers: {
//     'Content-Type': 'application/json',
//     'Content-Length': `${Buffer.byteLength(JSON.stringify(postParam))}`,
//   },
// });
