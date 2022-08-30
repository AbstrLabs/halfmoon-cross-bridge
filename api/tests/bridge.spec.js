
const request = require('supertest')
const app = require('../app')
const {pool, sql} = require('halfmoon-cross-bridge-database')

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
        expect(status).toBe(404)
    })

    test('should 400 if id is not provided', async () => {
        const {status, body} = await request(app).get(`/bridge`)
        expect(status).toBe(400)
    })

    test('should 400 if id is not in right format', async () => {
        const {status, body} = await request(app).get(`/bridge?id=a`)
        expect(status).toBe(400)
    })
})

describe('POST /bridge', () => {
    test('should succsess if everything right, no comment', async () => {
        let req = {
            from_addr: 'zxcvn.testnet',
            from_amount_atom: '30000',
            from_token_id: 2,
            from_txn_hash: '6vLJvWEfkWHASppZE5mcYmaCPnHPoVAGz1WzuDkV6Pij',
            from_txn_hash_sig: '5KHJVcNvNQuezWbGpbHqf3fo1qsHFVzPZHBbFSn8UP413DhZKAYVcnWppPjvgj4BtcHykcQDZCpBokPjqAXLAmKj',
            to_addr: 'NY5PBXI4JAC6AL4SJ4L43ZF3A2LVTP5IQQSVLANGOPTAF3FNSM5OQXRRVI',
            to_token_id: 3
        }
        const {status, body} = await request(app).post(`/bridge`)
            .send(req)
        console.log(body)
        expect(status).toBe(201)
        expect(body.id).toBeDefined()
    })

    test('should succsess if everything right with comment', async () => {
        let req = {
            from_addr: 'zxcvn.testnet',
            from_amount_atom: '30000',
            from_token_id: 2,
            from_txn_hash: '8wkT6RYjqCad6PN3gFG4e8tZpFfw9jGr8URUTekPaUer',
            from_txn_hash_sig: '66GLczubLKdUAZ4ppd9LvryX4FcCUCF26Am6eVPSaki5t444ZAkfUfQXM39m9Vw52qMFErPttR3h6Xdh6PfdRBbj',
            to_addr: 'NY5PBXI4JAC6AL4SJ4L43ZF3A2LVTP5IQQSVLANGOPTAF3FNSM5OQXRRVI',
            to_token_id: 3,
            comment: 'haha'
        }
        const {status, body} = await request(app).post(`/bridge`)
            .send(req)
        console.log(body)
        expect(status).toBe(201)
        expect(body.id).toBeDefined()
    })

    test('should fail if from_txn_hash and from_txn_hash_sig is same', async () => {
        let req = {
            from_addr: 'zxcvn.testnet',
            from_amount_atom: '30000',
            from_token_id: 2,
            from_txn_hash: 'Ad9wNkP7PfiPxyaepCyZAs2hxUnd7XyU6NvoSUzRjoKr',
            from_txn_hash_sig: '4LeqNrWEVo6npHrB8r3NQfQ1JJQMJaaZoPn78oCXLETqNBekfvuvMxWMReEmvAgPYLo34AfJQYyxvXGjVKTmQKZa',
            to_addr: 'NY5PBXI4JAC6AL4SJ4L43ZF3A2LVTP5IQQSVLANGOPTAF3FNSM5OQXRRVI',
            to_token_id: 3,
            comment: 'haha'
        }
        const {status, body} = await request(app).post(`/bridge`)
            .send(req)
        console.log(body)
        expect(status).toBe(400)
        expect(body).toEqual({msg: 'duplicate transaction'})
    })

    test('should fail if from_txn_hash and from_txn_hash_sig is same', async () => {
        let req = {
            from_addr: 'zxcvn.testnet',
            from_amount_atom: '30000',
            from_token_id: 2,
            from_txn_hash: 'Ad9wNkP7PfiPxyaepCyZAs2hxUnd7XyU6NvoSUzRjoKr',
            from_txn_hash_sig: '4LeqNrWEVo6npHrB8r3NQfQ1JJQMJaaZoPn78oCXLETqNBekfvuvMxWMReEmvAgPYLo34AfJQYyxvXGjVKTmQKZa',
            to_addr: 'NY5PBXI4JAC6AL4SJ4L43ZF3A2LVTP5IQQSVLANGOPTAF3FNSM5OQXRRVI',
            to_token_id: 3,
            comment: 'haha'
        }
        const {status, body} = await request(app).post(`/bridge`)
            .send(req)
        console.log(body)
        expect(status).toBe(400)
        expect(body).toEqual({msg: 'duplicate transaction'})
    })

    test('should success if only from_txn_hash is same', async () => {
        let req = {
            from_addr: 'zxcvn.testnet',
            from_amount_atom: '30000',
            from_token_id: 2,
            from_txn_hash: 'Ad9wNkP7PfiPxyaepCyZAs2hxUnd7XyU6NvoSUzRjoKr',
            from_txn_hash_sig: '66GLczubLKdUAZ4ppd9LvryX4FcCUCF26Am6eVPSaki5t444ZAkfUfQXM39m9Vw52qMFErPttR3h6Xdh6PfdRBbj',
            to_addr: 'NY5PBXI4JAC6AL4SJ4L43ZF3A2LVTP5IQQSVLANGOPTAF3FNSM5OQXRRVI',
            to_token_id: 3,
            comment: 'haha'
        }
        const {status, body} = await request(app).post(`/bridge`)
            .send(req)
        console.log(body)
        expect(status).toBe(201)
        expect(body.id).toBeDefined()
    })

    describe('should fail if missing param', () => {
        let req = {
            from_addr: 'zxcvn.testnet',
            from_amount_atom: '30000',
            from_token_id: 2,
            from_txn_hash: 'Ad9wNkP7PfiPxyaepCyZAs2hxUnd7XyU6NvoSUzRjoKr',
            from_txn_hash_sig: '5KHJVcNvNQuezWbGpbHqf3fo1qsHFVzPZHBbFSn8UP413DhZKAYVcnWppPjvgj4BtcHykcQDZCpBokPjqAXLAmKj',
            to_addr: 'NY5PBXI4JAC6AL4SJ4L43ZF3A2LVTP5IQQSVLANGOPTAF3FNSM5OQXRRVI',
            to_token_id: 3,
            comment: 'haha'
        }
        for (let missing of ['from_addr', 'from_amount_atom', 'from_token_id', 'from_txn_hash', 'from_txn_hash_sig', 'to_addr', 'to_token_id']) {
            it('missing ' + missing, async () => {
                let req2 = Object.assign({}, req)
                delete req2[missing]
                const {status, body} = await request(app).post(`/bridge`)
                    .send(req2)
                expect(status).toBe(400)
            })
        }
    })

    test('should fail if from_token_id and to_token_id is same', async () => {
        let req = {
            from_addr: 'zxcvn.testnet',
            from_amount_atom: '30000',
            from_token_id: 2,
            from_txn_hash: 'Ad9wNkP7PfiPxyaepCyZAs2hxUnd7XyU6NvoSUzRjoKr',
            from_txn_hash_sig: '5KHJVcNvNQuezWbGpbHqf3fo1qsHFVzPZHBbFSn8UP413DhZKAYVcnWppPjvgj4BtcHykcQDZCpBokPjqAXLAmKj',
            to_addr: 'NY5PBXI4JAC6AL4SJ4L43ZF3A2LVTP5IQQSVLANGOPTAF3FNSM5OQXRRVI',
            to_token_id: 2,
            comment: 'haha'
        }
        const {status, body} = await request(app).post(`/bridge`)
            .send(req)
        console.log(body)
        expect(status).toBe(400)
        expect(body).toEqual({msg: 'from_token and to_token must be different'})
    })
})

