require('dotenv').config();
process.env.NODE_ENV = 'test';
process.env.LOGGER_LEVEL = 'debug';

const { pool, sql, txn } = require('halfmoon-cross-bridge-database');
const { env } = require('../dist/utils');
const { depositOnAlgoTestnetFromExampleToMaster } = require('./utils');
const { worker } = require('../dist/worker');

async function main() {
  const outcome = await depositOnAlgoTestnetFromExampleToMaster('0.123');
  console.log(JSON.stringify(outcome, null, 2));
  await pool.query(
    sql.createRequest({
      from_addr: outcome.transaction.sender,
      from_amount_atom:
        outcome.transaction['asset-transfer-transaction'].amount,
      from_token_id: 3,
      from_txn_hash: outcome.transaction.id,
      to_addr: env('NEAR_EXAMPL_ADDR'),
      to_token_id: 2,
      comment: 'test burn',
    })
  );

  await worker(); // created -> done verify
  await worker(); // done verify -> doing outgoing
  await worker(); // doing outgoing -> done outgoing

  await pool.end();
}

main();
