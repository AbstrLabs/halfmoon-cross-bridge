import axios from 'axios';
import { WELCOME_JSON } from '../../server';

it('hosted API server returns welcome JSON on GET', async () => {
  const res = await axios.get('http://localhost:4190/');
  expect(res.data).toStrictEqual(WELCOME_JSON);
  expect(res.status).toBe(200);
  expect(res.statusText).toBe('OK');
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
