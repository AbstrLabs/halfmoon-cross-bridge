import { db } from '.';

describe('DB CRUD test', () => {
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
    console.log('result1 : ', result1); // DEV_LOG_TO_REMOVE
    console.log('result2 : ', result2); // DEV_LOG_TO_REMOVE

    // expect(result).toBeDefined();
  });
});
