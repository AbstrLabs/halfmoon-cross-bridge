/* This is not a test.
 * Using once to create a new mint table 20220503
 * with yarn command:
 * ```zsh
 * yarn test -t 'create new mint table'
 * ```
 */
import { ENV } from '../utils/dotenv';
import { postgres } from './aws-rds';

it.skip('create new mint table', async () => {
  // skip: not a test, designed to be run once
  ENV; // import process.env
  const fs = require('fs');

  const createNewMintTableQuery = fs.readFileSync(
    __dirname + '/creation.sql',
    'utf8'
  );
  await postgres.connect();
  await postgres.query(createNewMintTableQuery);
  await postgres.end();
});

it.skip('fs.read', () => {
  // skip: not needed
  const fs = require('fs');

  try {
    const data = fs.readFileSync(__dirname + '/creation.sql', 'utf8');
    console.log(data);
    expect(data).toBeDefined();
  } catch (err) {
    console.error(err);
  }
});
