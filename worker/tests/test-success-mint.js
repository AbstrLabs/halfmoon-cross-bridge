require('dotenv').config()
process.env.NODE_ENV='test'
process.env.LOGGER_LEVEL='debug'

const {pool, sql} = require('halfmoon-cross-bridge-database')
const {env} = require('../dist/utils')
const { sign_txn_hash } = require('./sign-txn-hash')
const {transferOnNearTestnetFromExampleToMaster} = require('./utils')
const {worker} = require('../dist/worker')
async function main() {
    const outcome = await transferOnNearTestnetFromExampleToMaster('0.123')
    console.log(JSON.stringify(outcome, null, 2))

    await pool.query(sql.createRequest({
        from_addr: outcome.transaction.signer_id,
        from_amount_atom: outcome.transaction.actions[0].Transfer.deposit,
        from_token_id: 2,
        from_txn_hash: outcome.transaction.hash,
        from_txn_hash_sig: await sign_txn_hash(outcome.transaction.hash, env('NEAR_EXAMPL_PRIV')),
        to_addr: env('ALGO_EXAMPL_ADDR'),
        to_token_id: 3,
        comment: 'test mint'
    }))

    await worker() // created -> done verify
    await worker() // done verify -> doing outgoing
    await worker() // doing outgoing -> done outgoing


    await pool.end()
}

main()