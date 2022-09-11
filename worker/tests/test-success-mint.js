require('dotenv').config()
process.env.NODE_ENV='test'
process.env.LOGGER_LEVEL='debug'

const {pool, sql} = require('halfmoon-cross-bridge-database')
const {env} = require('../dist/utils')
const {depositOnNearTestnetFromExampleToMaster} = require('./utils')
const {worker} = require('../dist/worker')
async function main() {
    const outcome = await depositOnNearTestnetFromExampleToMaster('0.123')
    console.log(JSON.stringify(outcome, null, 2))

    await pool.query(sql.createRequest({
        from_addr: outcome.transaction.signer_id,
        from_amount_atom: outcome.transaction.actions[0].FunctionCall.deposit,
        from_token_id: 2,
        from_txn_hash: outcome.transaction.hash,
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