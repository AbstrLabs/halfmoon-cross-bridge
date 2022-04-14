import { ENV } from '../utils/dotenv';
import { db } from '.';
import { pgStart } from './aws-rds';

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
    it('connect to AWS-RDS', async () => {
      expect(await pgStart()).toBe(0);
    });
  });
});
