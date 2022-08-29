const request = require('supertest');
const app = require('../app');

describe('GET /fees', () => {
  test('should get fee if exist', async () => {
    const { status, body } = await request(app).get('/fees?from_token_id=2&to_token_id=3');
    console.log(body);
    expect(status).toBe(200);
    expect(body).toEqual([
      {
        bridge_type: 'MINT',
        from_token_addr: null,
        from_token_blockchain: 'NEAR',
        from_token_name: 'NEAR',
        to_token_addr: '83251085',
        to_token_blockchain: 'Algorand',
        to_token_name: 'goNEAR',
        fixed_fee_atom: '1',
        from_token_id: 2,
        margin_fee_atom: '0',
        to_token_id: 3,
        from_token_atoms: 24,
        to_token_atoms: 10
      },
    ]);
  });

  test('should get no fee if does not exist', async () => {
    const { status, body } = await request(app).get('/fees?from_token_id=2&to_token_id=4');
    console.log(body);
    expect(status).toBe(200);
    expect(body).toEqual([]);
  });

  test('should error if param is wrong', async () => {
    const { status, body } = await request(app).get('/fees?from_token_id=2&blabla=4');
    console.log(body);
    expect(status).toBe(400);
    expect(body).toEqual({
      errors: [
        'instance requires property "to_token_id"',
        'instance is not allowed to have the additional property "blabla"',
      ],
    });
  });

  test('should error if param is not number', async () => {
    const { status, body } = await request(app).get('/fees?from_token_id=a&to_token_id=b');
    console.log(body);
    expect(status).toBe(400);
    expect(body).toEqual({
      errors: ['instance.from_token_id is not of a type(s) number', 'instance.to_token_id is not of a type(s) number'],
    });
  });
});
