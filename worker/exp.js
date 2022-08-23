const {sql, txn, pool} = require('artificio-bridge-database')

async function main() {
    await txn(async(client) => {
        let r = await client.query(sql.readRequestToProcess())
        console.log(r.rows)

        let r2 = await client.query(sql.readRequestToProcess())
        console.log(r2.rows)
        while(true){}
    })
    await pool.end()
}

main()