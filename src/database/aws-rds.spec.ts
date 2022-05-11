import { ENV } from '../utils/dotenv';
import fs from 'fs';
import { postgres } from './aws-rds';

describe('AWS-RDS capability test', () => {
  ENV; // to load .env file

  // it('connect to AWS-RDS via class', async () => {
  //   expect(await postgres._connectionTest()).toBe('Hello world!');
  // });

  it('create and drop a new table', async () => {
    const tableName = 'test_table_fakeNonce';
    const query = `CREATE TABLE ${tableName} (
        id SERIAL PRIMARY KEY,
        test_date BIGINT NOT NULL
        );`;
    const res = await postgres.query(query);

    expect(res.length).toBe(0);
    const res2 = await postgres.query(`DROP TABLE ${tableName};`);
    expect(res2.length).toBe(0);
  });
  // it('CRUD in test_table', async () => {
  it('read and write to test_table', async () => {
    const tableName = 'test_table';
    const date = +new Date();
    const query = `INSERT INTO ${tableName} (test_date) VALUES ($1);`;

    // await postgres.connect();
    const res = await postgres.query(query, [date]);
    const res2 = await postgres.query(`SELECT * FROM ${tableName};`);
    // postgres.disconnect();

    expect(res.length).toBe(0);
    expect(res2.at(-1).test_date).toBe(date.toString());
  });
  it.skip('update in test_table', async () => {
    // TODO: should run sequentially. skipped for now
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
    postgres.disconnect();

    expect(res.length).toBe(0);
    // Without sorting, first element in res2 has id 2.
    expect(res2[0].test_date).toBe(date.toString());
  });
  it.skip('delete last entry in test_table', async () => {
    // TODO: should run sequentially. skipped for now
    // todo: maybe just check MAX(id)?
    const tableName = 'test_table';
    const query = `DELETE FROM ${tableName} WHERE id = (SELECT MAX(id) FROM ${tableName});`;

    await postgres.connect();
    const res_before_del = await postgres.query(`SELECT * FROM ${tableName} ;`);
    const res = await postgres.query(query);
    const res_after_del = await postgres.query(`SELECT * FROM ${tableName} ;`);
    postgres.disconnect();

    expect(res.length).toBe(0);
    expect(res_before_del.length - res_after_del.length).toBe(1);
  });
});

/* The part below is not a test. It creates a table in the database.
 *
 * TIPS: It's better to use Postico instead of this file.
 *
 * Using once to create a new mint table 20220503
 * with yarn command:
 * ```zsh
 * yarn test -t 'create new mint table'
 * yarn test -t 'create new burn table'
 * ```
 */

it.skip('create new mint table', async () => {
  // skip: not a test, designed to be run once
  ENV; // import process.env

  const createNewMintTableQuery = fs.readFileSync(
    __dirname + '/sql/mint-creation.sql',
    'utf8'
  );
  await postgres.connect();
  await postgres.query(createNewMintTableQuery);
  await postgres.end();
});

it.skip('create new burn table', async () => {
  // skip: not a test, designed to be run once
  ENV; // import process.env

  const createNewBurnTableQuery = fs.readFileSync(
    __dirname + '/sql/burn-creation.sql',
    'utf8'
  );
  await postgres.connect();
  await postgres.query(createNewBurnTableQuery);
  await postgres.end();
});

it.skip('fs.read', () => {
  // skip: not needed

  try {
    const data = fs.readFileSync(__dirname + '/creation.sql', 'utf8');
    console.log(data);
    expect(data).toBeDefined();
  } catch (err) {
    console.error(err);
  }
});
