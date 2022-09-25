const request = require("supertest");
const app = require("../app");
const { pool, sql } = require("halfmoon-cross-bridge-database");

let firstId;

beforeAll(async () => {
    await pool.query(sql.deleteAllRequests());

    firstId = (
        await pool.query(
            sql.createRequest({
                from_addr: "zxcvn.testnet",
                from_token_id: 2,
                from_txn_hash: "Ad9wNkP7PfiPxyaepCyZAs2hxUnd7XyU6NvoSUzRjoKr",
                to_token_id: 3,
                comment: "something",
            })
        )
    ).rows[0].id;

    await pool.query(
        sql.createRequest({
            from_addr: "zxcvn.testnet",
            from_token_id: 2,
            from_txn_hash: "AM9YSv5P6rkBf9mVtyDysFCanbgEg6HPRom7qtu4AKbF",
            to_token_id: 3,
            comment: null,
        })
    );
});

afterAll(async () => {
    await pool.query(sql.deleteAllRequests());
});

describe("GET /bridge", () => {
    test("should get bridge txn", async () => {
        const { status, body } = await request(app).get(`/bridge?id=${firstId}`);
        expect(status).toBe(200);
        expect(body.id).toBe(firstId);
        expect(body.from_addr).toBe("zxcvn.testnet");
        expect(body.from_amount_atom).toBe(null);
        expect(body.from_token_id).toBe(2);
        expect(body.from_txn_hash).toBe("Ad9wNkP7PfiPxyaepCyZAs2hxUnd7XyU6NvoSUzRjoKr");
        expect(body.to_txn_hash).toBe(null);
        expect(body.to_addr).toBe(null);
        expect(body.to_token_id).toBe(3);
        expect(body.comment).toBe("something");
        expect(body.invalid_reason).toBe(null);
        expect(body.err_msg).toBe(null);
        expect(body.request_status).toBe("CREATED");
    });

    test("should 404 if txn does not exist", async () => {
        const { status, body } = await request(app).get(`/bridge?id=${firstId + 100}`);
        expect(status).toBe(404);
    });

    test("should 400 if id is not provided", async () => {
        const { status, body } = await request(app).get(`/bridge`);
        expect(status).toBe(400);
    });

    test("should 400 if id is not in right format", async () => {
        const { status, body } = await request(app).get(`/bridge?id=a`);
        expect(status).toBe(400);
    });
});

describe("POST /bridge", () => {
    test("should success if everything right, no comment", async () => {
        let req = {
            from_addr: "zxcvn.testnet",
            from_token_id: 2,
            from_txn_hash: "6vLJvWEfkWHASppZE5mcYmaCPnHPoVAGz1WzuDkV6Pij",
            to_token_id: 3,
        };
        const { status, body } = await request(app).post(`/bridge`).send(req);
        expect(status).toBe(201);
        expect(body.id).toBeDefined();
    });

    test("should succsess if everything right with comment", async () => {
        let req = {
            from_addr: "zxcvn.testnet",
            from_token_id: 2,
            from_txn_hash: "8wkT6RYjqCad6PN3gFG4e8tZpFfw9jGr8URUTekPaUer",
            to_token_id: 3,
            comment: "haha",
        };
        const { status, body } = await request(app).post(`/bridge`).send(req);
        expect(status).toBe(201);
        expect(body.id).toBeDefined();
    });

    test("should fail if from_txn_hash is same", async () => {
        let req = {
            from_addr: "zxcvn.testnet",
            from_token_id: 2,
            from_txn_hash: "Ad9wNkP7PfiPxyaepCyZAs2hxUnd7XyU6NvoSUzRjoKr",
            to_token_id: 3,
            comment: "haha",
        };
        const { status, body } = await request(app).post(`/bridge`).send(req);
        expect(status).toBe(400);
        expect(body).toEqual({ msg: "duplicate transaction" });
    });

    describe("should fail if missing param", () => {
        let req = {
            from_addr: "zxcvn.testnet",
            from_token_id: 2,
            from_txn_hash: "Ad9wNkP7PfiPxyaepCyZAs2hxUnd7XyU6NvoSUzRjoKr",
            to_token_id: 3,
            comment: "haha",
        };
        for (let missing of ["from_addr", "from_token_id", "from_txn_hash", "to_addr"]) {
            it("missing " + missing, async () => {
                let req2 = Object.assign({}, req);
                delete req2[missing];
                const { status, body } = await request(app).post(`/bridge`).send(req2);
                expect(status).toBe(400);
            });
        }
    });

    test("should fail if from_token_id and to_token_id is same", async () => {
        let req = {
            from_addr: "zxcvn.testnet",
            from_token_id: 2,
            from_txn_hash: "Ad9wNkP7PfiPxyaepCyZAs2hxUnd7XyU6NvoSUzRjoKr",
            to_token_id: 2,
            comment: "haha",
        };
        const { status, body } = await request(app).post(`/bridge`).send(req);
        expect(status).toBe(400);
        expect(body).toEqual({ msg: "from_token and to_token must be different" });
    });
});
