const {pool, sql} = require('../db.js');
const yargs = require('yargs/yargs');
const hideBin = require('yargs/helpers').hideBin;

async function main() {
    const argv = yargs(hideBin(process.argv)).argv
    // addr is optional
    let {name, blockchain, addr} = argv
    await pool.query(sql.createToken({name, blockchain, addr}))
    await pool.end()
}

main()
