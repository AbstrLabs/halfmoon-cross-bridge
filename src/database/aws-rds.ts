import { Client } from 'pg';

export { pgAwsRdsConnectionTest };

// (async () => {
//   pgStart();
// })();

async function pgAwsRdsConnectionTest() {
  const client = new Client();
  await client.connect();

  async function example_write() {
    const res = await client.query('SELECT $1::text as message', [
      'Hello world!',
    ]);
    console.log(res.rows[0].message); // Hello world!
  }

  async function example_read() {
    var res;
    try {
      res = await client.query('SELECT $1::text as message', ['Hello world!']);
      console.log('res.rows[0].message : ', res.rows[0].message); // DEV_LOG_TO_REMOVE
      return res.rows[0].message;
    } catch (err: any) {
      console.log(err.stack); // Hello World!
      throw new Error(err.stack);
    }
  }

  await example_write();
  const result = await example_read();

  await client.end();

  return result;
}
