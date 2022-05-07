import { BridgeTxn } from '../blockchain/bridge';
import { BridgeTxnStatus } from '..';
import { ENV } from '../utils/dotenv';
import { TxnType } from '../blockchain';
import { db } from '.';
import { exampleBridgeTxn } from '../utils/test-helper';

describe('DATABASE test', () => {
  beforeAll(async () => {
    await db.connect();
  });
  afterAll(async () => {
    db.disconnect();
    await db.end();
  });
  describe('AWS-RDS capability test', () => {
    ENV; // to load .env file

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
    // it('CRUD in test_table', async () => {
    it('read and write to test_table', async () => {
      const tableName = 'test_table';
      const date = +new Date();
      const query = `INSERT INTO ${tableName} (test_date) VALUES ($1);`;

      await db.connect();
      const res = await db.query(query, [date]);
      const res2 = await db.query(`SELECT * FROM ${tableName};`);
      db.disconnect();

      expect(res.length).toBe(0);
      expect(res2.at(-1).test_date).toBe(date.toString());
    });
    it.skip('update in test_table', async () => {
      // TODO: should run sequentially. skipped for now
      const tableName = 'test_table';
      const targetId = 1;
      const date = +new Date();
      const query = `UPDATE ${tableName} SET test_date = $1 WHERE id = $2;`;

      await db.connect();
      const res = await db.query(query, [date, targetId]);
      const res2 = await db.query(`SELECT * FROM ${tableName} WHERE id = $1;`, [
        targetId,
      ]);
      db.disconnect();

      expect(res.length).toBe(0);
      // Without sorting, first element in res2 has id 2.
      expect(res2[0].test_date).toBe(date.toString());
    });
    it.skip('delete last entry in test_table', async () => {
      // TODO: should run sequentially. skipped for now
      // todo: maybe just check MAX(id)?
      const tableName = 'test_table';
      const query = `DELETE FROM ${tableName} WHERE id = (SELECT MAX(id) FROM ${tableName});`;

      await db.connect();
      const res_before_del = await db.query(`SELECT * FROM ${tableName} ;`);
      const res = await db.query(query);
      const res_after_del = await db.query(`SELECT * FROM ${tableName} ;`);
      db.disconnect();

      expect(res.length).toBe(0);
      expect(res_before_del.length - res_after_del.length).toBe(1);
    });
  });
  describe('CRUD test with Bridge Txn', () => {
    it('create a transaction', async () => {
      const res = await db.createTxn(exampleBridgeTxn);
      expect(typeof res).toBe('number');
    });
    it.only('read a transaction', async () => {
      // TODO: BT-dbId: have a getter for dbId
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const res = await db.readTxn(exampleBridgeTxn.dbId!, TxnType.MINT);
      console.log('typeof res : ', typeof res); // DEV_LOG_TO_REMOVE
      console.log(
        'typeof res.from_amount_atom : ',
        typeof res.from_amount_atom
      ); // DEV_LOG_TO_REMOVE
      console.log('res : ', res); // DEV_LOG_TO_REMOVE
      expect(typeof res).toBe('object');

      expect(BridgeTxn.fromDbItem(res, TxnType.MINT)).toEqual(exampleBridgeTxn);
    });
    it('update a transaction', async () => {
      exampleBridgeTxn.txnStatus = BridgeTxnStatus.DONE_OUTGOING;
      exampleBridgeTxn.toTxnId = 'some_fake_txn_id';
      const res1 = await db.updateTxn(exampleBridgeTxn);
      expect(typeof res1).toBe('number');

      // read the updated transaction
      // TODO: BT-dbId: have a getter for dbId
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const res2 = await db.readTxn(exampleBridgeTxn.dbId!, TxnType.MINT);
      expect(typeof res2).toBe('object');
      // verify updated transaction is correct
      expect(BridgeTxn.fromDbItem(res2, TxnType.MINT)).toEqual(
        exampleBridgeTxn
      );
    });
  });
});
