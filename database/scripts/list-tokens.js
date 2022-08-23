const {pool, sql} = require('..');

async function main() {
    let r = await pool.query(sql.readTokens())
    console.log(JSON.stringify(r.rows, null, 2))
    await pool.end()
}

main()
