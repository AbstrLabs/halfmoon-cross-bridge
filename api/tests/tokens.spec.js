
const request = require('supertest')
const app = require('../app')

describe('GET /tokens', () => {
    test('Should return tokens', async () => {
        const {status, body} = await request(app).get('/tokens')
        expect(status).toBe(200)
        expect(body).toEqual([{"addr": null, "blockchain": "Algorand", "id": 1, "name": "ALGO"}, {"addr": null, "blockchain": "NEAR", "id": 2, "name": "NEAR"}, {"addr": "83251085", "blockchain": "Algorand", "id": 3, "name": "goNEAR"}])
    })
})