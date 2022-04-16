import { ENV } from '../utils/dotenv';
import { db } from '.';
import { postgres } from './aws-rds';

describe('database test', () => {
  describe('NeDB CRUD test', () => {
    if (ENV.DB_ORIGIN !== 'NEDB') {
      expect(true).toBe(true);
      return;
    }
    it('should be defined', () => {
      expect(db).toBeDefined();
    });
    it('should be able to insert + find', async () => {
      const date = Date().toString();
      db.insert({ testDate: date });
      const result1 = db.find({ testDate: date }, (err: any, docs: any) => {
        expect(err).toBeNull();
        expect(docs.length).toBe(1);
        expect(docs[0].testDate).toBe(date);
      });
      const result2 = db.find({ testDate: date });
      expect(result1).not.toBeDefined();
      expect(result2).toBeDefined();
    });
  });
  describe('AWS-RDS test', () => {
    if (ENV.DB_ORIGIN !== 'AWS_RDS') {
      expect(true).toBe(true);
      return;
    }
    // const postgres = new Postgres(Postgres._configFromEnv());
    it('connect to AWS-RDS via class', async () => {
      expect(await postgres._connectionTest()).toBe('Hello world!');
    });
    it('create and drop a new table', async () => {
      const tableName = 'test_table_fakeNonce';
      const query = `CREATE TABLE ${tableName} (
        id SERIAL PRIMARY KEY,
        test_date BIGINT NOT NULL
        );`;

      await postgres.connect();
      const res = await postgres.query(query);
      await postgres.disconnect();

      expect(res.length).toBe(0);
      const res2 = await postgres.query(`DROP TABLE ${tableName};`);
      expect(res2.length).toBe(0);
    });
    it('read and write to test_table', async () => {
      const tableName = 'test_table';
      const date = +new Date();
      const query = `INSERT INTO ${tableName} (test_date) VALUES ($1);`;

      await postgres.connect();
      const res = await postgres.query(query, [date]);
      const res2 = await postgres.query(`SELECT * FROM ${tableName};`);
      await postgres.disconnect();

      expect(res.length).toBe(0);
      expect(res2.at(-1).test_date).toBe(date.toString());
    });
    it('update in test_table', async () => {
      const tableName = 'test_table';
      const targetId = 1;
      const date = +new Date();
      const query = `UPDATE ${tableName} SET test_date = $1 WHERE id = $2;`;

      await postgres.connect();
      const res = await postgres.query(query, [date, targetId]);
      const res2 = await postgres.query(
        `SELECT * FROM ${tableName} WHERE id = $1;`,
        [targetId]
      );
      await postgres.disconnect();

      expect(res.length).toBe(0);
      // Without sorting, first element in res2 has id 2.
      expect(res2[0].test_date).toBe(date.toString());
    });

    it('delete last entry in test_table', async () => {
      // todo: maybe just check MAX(id)?
      const tableName = 'test_table';
      const query = `DELETE FROM ${tableName} WHERE id = (SELECT MAX(id) FROM ${tableName});`;

      await postgres.connect();
      const res_before_del = await postgres.query(
        `SELECT * FROM ${tableName} ;`
      );
      const res = await postgres.query(query);
      const res_after_del = await postgres.query(
        `SELECT * FROM ${tableName} ;`
      );
      await postgres.disconnect();

      expect(res.length).toBe(0);
      expect(res_before_del.length - res_after_del.length).toBe(1);
    });
  });
});
