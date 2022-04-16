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
      await postgres.connect();
      const tableName = 'test_table_fakeNonce';
      const query = `CREATE TABLE ${tableName} (
        id SERIAL PRIMARY KEY,
        test_date TIMESTAMP NOT NULL
      );`;
      const res = await postgres.query(query);
      expect(res.length).toBe(0);
      const res2 = await postgres.query(`DROP TABLE ${tableName};`);
      expect(res2.length).toBe(0);
      await postgres.disconnect();
    });
  });
});
