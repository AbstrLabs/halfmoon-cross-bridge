const {pool, sql} = require('..');
const yargs = require('yargs/yargs');
const hideBin = require('yargs/helpers').hideBin;

async function main() {
    const argv = yargs(hideBin(process.argv)).argv
    // addr is optional
    let {name, blockchain, addr} = argv
    let id = (await pool.query(sql.createToken({name, blockchain, addr}))).rows[0].id
    console.log(id)
    await pool.end()
}

main()
