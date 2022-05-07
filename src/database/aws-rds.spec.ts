/* This is not a test.
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
import { ENV } from '../utils/dotenv';
import fs from 'fs';
import { postgres } from './aws-rds';

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