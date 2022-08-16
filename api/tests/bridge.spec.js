
const request = require('supertest')
const app = require('../app')
const {pool, sql} = require('artificio-bridge-database/db')

let firstId

beforeAll(async () => {
    await pool.query(sql.deleteAllRequests())

    firstId = (await pool.query(sql.createRequest({
        from_addr: 'zxcvn.testnet',
        from_amount_atom: '200000',
        from_token_id: 2,
        from_txn_hash: 'Ad9wNkP7PfiPxyaepCyZAs2hxUnd7XyU6NvoSUzRjoKr',
        from_txn_hash_sig: '4LeqNrWEVo6npHrB8r3NQfQ1JJQMJaaZoPn78oCXLETqNBekfvuvMxWMReEmvAgPYLo34AfJQYyxvXGjVKTmQKZa',
        to_addr: 'XFYAYSEGQIY2J3DCGGXCPXY5FGHSVKM3V4WCNYCLKDLHB7RYDBU233QB5M',
        to_token_id: 3,
        comment: 'something'
    }))).rows[0].id

    await pool.query(sql.createRequest({
        from_addr: 'zxcvn.testnet',
        from_amount_atom: '50000',
        from_token_id: 2,
        from_txn_hash: 'AM9YSv5P6rkBf9mVtyDysFCanbgEg6HPRom7qtu4AKbF',
        from_txn_hash_sig: '5xTnBbwSQZqdzqD5LJLkpag8o7ASBMX7ER1vwk1mjLKy6u5TPmNs7AJfQwqkeWbMXMUkxfyhs2FzjpyJbTmqPnQM',
        to_addr: 'NY5PBXI4JAC6AL4SJ4L43ZF3A2LVTP5IQQSVLANGOPTAF3FNSM5OQXRRVI',
        to_token_id: 3,
        comment: null
    }))

})

afterAll(async () => {
    await pool.query(sql.deleteAllRequests())
})

describe('GET /bridge', () => {
    test('should get bridge txn', async () => {
        console.log(firstId)
        const {status, body} = await request(app).get(`/bridge?id=${firstId}`)
        console.log(body)
        expect(status).toBe(200)
        expect(body.id).toBe(firstId)
        expect(body.from_addr).toBe('zxcvn.testnet')
        expect(body.from_amount_atom).toBe('200000')
        expect(body.from_token_id).toBe(2)
        expect(body.from_txn_hash).toBe('Ad9wNkP7PfiPxyaepCyZAs2hxUnd7XyU6NvoSUzRjoKr')
        expect(body.from_txn_hash_sig).toBe('4LeqNrWEVo6npHrB8r3NQfQ1JJQMJaaZoPn78oCXLETqNBekfvuvMxWMReEmvAgPYLo34AfJQYyxvXGjVKTmQKZa')
        expect(body.to_txn_hash).toBe(null)
        expect(body.to_addr).toBe('XFYAYSEGQIY2J3DCGGXCPXY5FGHSVKM3V4WCNYCLKDLHB7RYDBU233QB5M')
        expect(body.to_token_id).toBe(3)
        expect(body.comment).toBe('something')
        expect(body.invalid_reason).toBe(null)
        expect(body.err_msg).toBe(null)
        expect(body.request_status).toBe('CREATED')
    })

    test('should 404 if txn does not exist', async () => {
        const {status, body} = await request(app).get(`/bridge?id=${firstId+100}`)
        console.log(body)
        expect(status).toBe(404)
        console.log(body)
    })
})

describe('POST /bridge', () => {

})

