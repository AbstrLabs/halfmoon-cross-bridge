import { ENV } from '../utils/dotenv';
import fs from 'fs';
import { postgres } from './aws-rds';
import { getNonce } from '../utils/literals';

const NONCE = getNonce();
const TEST_TABLE_NAME = `test_${NONCE}`;

describe('AWS-RDS capability test', () => {
  // it('connect to AWS-RDS via class', async () => {
  //   expect(await postgres._connectionTest()).toBe('Hello world!');
  // });
  it('create and drop a new table, do CRUD in between', async () => {
    // this large test did too many things because they need to run in order
    /* CREATE TABLE */
    const createTableQuery = `CREATE TABLE ${TEST_TABLE_NAME} (
        id SERIAL PRIMARY KEY,
        test_date BIGINT NOT NULL
        );`;
    const createRes = await postgres.query(createTableQuery);
    expect(createRes.length).toBe(0);

    /* CREATE ENTRY */
    const createDate = +new Date();
    const createEntryQuery = `INSERT INTO ${TEST_TABLE_NAME} (test_date) VALUES ($1);`;
    const createEntryRes = await postgres.query(createEntryQuery, [createDate]);
    const readEntryRes = await postgres.query(
      `SELECT * FROM ${TEST_TABLE_NAME};`
    );
    expect(createEntryRes.length).toBe(0);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(readEntryRes.at(-1).test_date).toBe(createDate.toString());

    /* UPDATE ENTRY */
    const updateDate = +new Date();
    const updateEntryQuery = `UPDATE ${TEST_TABLE_NAME} SET test_date = $1 WHERE id = $2;`;
    const updateEntryRes = await postgres.query(updateEntryQuery, [
      updateDate,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      readEntryRes.at(-1).id,
    ]);
    const readUpdatedEntryRes = await postgres.query(
      `SELECT * FROM ${TEST_TABLE_NAME};`
    );
    expect(updateEntryRes.length).toBe(0);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(readUpdatedEntryRes.at(-1).test_date).toBe(updateDate.toString());

    /* DELETE ENTRY */
    const deleteEntryQuery = `DELETE FROM ${TEST_TABLE_NAME} WHERE id = $1;`;
    const deleteEntryRes = await postgres.query(deleteEntryQuery, [
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      readUpdatedEntryRes.at(-1).id,
    ]);
    const readDeletedEntryRes = await postgres.query(
      `SELECT * FROM ${TEST_TABLE_NAME};`
    );
    expect(deleteEntryRes.length).toBe(0);
    expect(readDeletedEntryRes.length).toBe(0);

    /* DROP TABLE */
    const dropTableRes = await postgres.query(`DROP TABLE ${TEST_TABLE_NAME};`);
    expect(dropTableRes.length).toBe(0);
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
    console.info(data);
    expect(data).toBeDefined();
  } catch (err) {
    console.error(err);
  }
});
