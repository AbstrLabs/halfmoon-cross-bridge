const pg = require('pg')
const sql = require('yesql')(__dirname + '/sql/',  {type: 'pg'})
const dbConfigName = process.env.NODE_ENV || "dev"
const fs = require('fs')

const pool = (dbConfigName == "production") ?
             new pg.Pool() :
             new pg.Pool(JSON.parse(fs.readFileSync(__dirname + "/database.json"))[dbConfigName])

const poolQuery1 = async(query) => {
  let res = await pool.query(sql[Object.keys(query)[0]](Object.values(query)[0]))
  return res.rows[0]
}

const clientQuery1 = async(client, query) => {
  let res = await client.query(sql[Object.keys(query)[0]](Object.values(query)[0]))
  return res.rows[0]
}

const txn = async (actions) => {
  // note: we don't try/catch this because if connecting throws an exception
  // we don't need to dispose of the client (it will be undefined)
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    let result = await actions(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

module.exports = { pool, txn, sql, dbConfigName, poolQuery1, clientQuery1 }