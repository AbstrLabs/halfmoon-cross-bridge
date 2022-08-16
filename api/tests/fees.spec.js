
const request = require('supertest')
const app = require('../app')

describe('GET /fees', () => {
    test('should get fee if exist', async () => {
        const {status, body} = await request(app).get('/fees?from_token_id=2&to_token_id=3')
        console.log(body)
        expect(status).toBe(200)
        expect(body).toEqual([{"bridge_type": "MINT", "fixed_fee_atom": "1", "from_token_id": 2, "margin_fee_atom": "0", "to_token_id": 3}])
    })

    test('should get no fee if does not exist', async () => {
        const {status, body} = await request(app).get('/fees?from_token_id=2&to_token_id=4')
        console.log(body)
        expect(status).toBe(200)
        expect(body).toEqual([])

    })
})