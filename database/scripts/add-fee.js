const {pool, sql} = require('../db.js');
const yargs = require('yargs/yargs');
const hideBin = require('yargs/helpers').hideBin;

async function main() {
    const argv = yargs(hideBin(process.argv)).argv
    // addr is optional
    let {from_token_id, to_token_id, bridge_type, fixed_fee_atom, margin_fee_atom} = argv
    await pool.query(sql.createFee({from_token_id, to_token_id, bridge_type, fixed_fee_atom, margin_fee_atom}))
    await pool.end()
}

main()
