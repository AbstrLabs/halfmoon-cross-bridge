import { Client } from 'pg';

export { pgAwsRdsConnectionTest };

// (async () => {
//   pgStart();
// })();

async function pgAwsRdsConnectionTest() {
  const client = new Client();
  await client.connect();
  const res = await client.query('SELECT $1::text as message', [
    'Hello world!',
  ]);
  await client.end();
  return res.rows[0].message;
}
