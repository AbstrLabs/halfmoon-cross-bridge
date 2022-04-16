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
    it.only('connect to AWS-RDS via class', async () => {
      expect(await postgres._connectionTest()).toBe('Hello world!');
    });
  });
});
