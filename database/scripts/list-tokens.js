const {pool, sql} = require('../db.js');

async function main() {
    let r = await pool.query(sql.readTokens())
    console.log(JSON.stringify(r.rows, null, 2))
    await pool.end()
}

main()
