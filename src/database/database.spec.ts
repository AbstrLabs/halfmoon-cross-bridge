import { BlockchainName, BridgeTxnInfo, BridgeTxnStatus } from '..';

import { ENV } from '../utils/dotenv';
import { db } from '.';
import { dbItemToBridgeTxnInfo } from '../utils/formatter';
import { exampleBridgeTxnInfo } from '../utils/test-helper';

describe('DATABASE test', () => {
  describe('AWS-RDS capability test', () => {
    afterAll(async () => {
      await db.end();
    });
    let _ = ENV; // to load .env file
    // it('connect to AWS-RDS via class', async () => {
    //   expect(await db._connectionTest()).toBe('Hello world!');
    // });
    it('create and drop a new table', async () => {
      const tableName = 'test_table_fakeNonce';
      const query = `CREATE TABLE ${tableName} (
        id SERIAL PRIMARY KEY,
        test_date BIGINT NOT NULL
        );`;

      await db.connect();
      const res = await db.query(query);
      await db.disconnect();

      expect(res.length).toBe(0);
      const res2 = await db.query(`DROP TABLE ${tableName};`);
      expect(res2.length).toBe(0);
    });
    it('read and write to test_table', async () => {
      const tableName = 'test_table';
      const date = +new Date();
      const query = `INSERT INTO ${tableName} (test_date) VALUES ($1);`;

      await db.connect();
      const res = await db.query(query, [date]);
      const res2 = await db.query(`SELECT * FROM ${tableName};`);
      await db.disconnect();

      expect(res.length).toBe(0);
      expect(res2.at(-1).test_date).toBe(date.toString());
    });
    it('update in test_table', async () => {
      const tableName = 'test_table';
      const targetId = 1;
      const date = +new Date();
      const query = `UPDATE ${tableName} SET test_date = $1 WHERE id = $2;`;

      await db.connect();
      const res = await db.query(query, [date, targetId]);
      const res2 = await db.query(`SELECT * FROM ${tableName} WHERE id = $1;`, [
        targetId,
      ]);
      await db.disconnect();

      expect(res.length).toBe(0);
      // Without sorting, first element in res2 has id 2.
      expect(res2[0].test_date).toBe(date.toString());
    });
    it('delete last entry in test_table', async () => {
      // todo: maybe just check MAX(id)?
      const tableName = 'test_table';
      const query = `DELETE FROM ${tableName} WHERE id = (SELECT MAX(id) FROM ${tableName});`;

      await db.connect();
      const res_before_del = await db.query(`SELECT * FROM ${tableName} ;`);
      const res = await db.query(query);
      const res_after_del = await db.query(`SELECT * FROM ${tableName} ;`);
      await db.disconnect();

      expect(res.length).toBe(0);
      expect(res_before_del.length - res_after_del.length).toBe(1);
    });
  });
  describe('create transaction', () => {
    beforeAll(async () => {
      await db.connect();
    });
    afterAll(async () => {
      db.disconnect();
      await db.end();
    });

    it.skip('create a transaction', async () => {
      const res = await db.createMintTxn({
        ...exampleBridgeTxnInfo,
        timestamp: BigInt(+new Date()),
        txnStatus: BridgeTxnStatus.MAKE_OUTGOING,
      });
      expect(typeof res).toBe('number');
    });
    it('read a transaction', async () => {
      const res = await db.readMintTxn(1);
      expect(typeof res).toBe('object');
      // expect(res).toEqual(exampleTxnInfo);
    });
    it('update a transaction', async () => {
      exampleBridgeTxnInfo.txnStatus = BridgeTxnStatus.DONE_OUTGOING;
      exampleBridgeTxnInfo.toTxnId = 'some_fake_txn_id';
      const res1 = await db.updateMintTxn(exampleBridgeTxnInfo);
      expect(typeof res1).toBe('number');

      // read the updated transaction
      const res2 = await db.readMintTxn(exampleBridgeTxnInfo.dbId!);
      expect(typeof res2).toBe('object');
      // verify updated transaction is correct
      expect(
        dbItemToBridgeTxnInfo(res2, {
          fromBlockchain: BlockchainName.NEAR,
          toBlockchain: BlockchainName.ALGO,
        })
      ).toEqual(exampleBridgeTxnInfo);
    });
  });
});
