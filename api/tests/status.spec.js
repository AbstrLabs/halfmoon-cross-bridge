
const request = require('supertest')
const app = require('../app')

describe('GET /status', () => {
    test('Should return status', async () => {
        const {status, body} = await request(app).get('/status')
        expect(status).toBe(200)
        expect(body.API_SERVER).toBe('https://api.halfmooncross.com/')
    })
})