#!/usr/bin/env node

const {sql, txn, pool} = require('..')


async function main () {
    // if (process.env.NODE_ENV != 'test') {
    //     console.log('Not in test environment, skipping')
    //     process.exit(0)
    // }

    await pool.query(sql.createRequest({
        from_addr: 'zxcvn.testnet',
        from_amount_atom: '200000',
        from_token_id: 2,
        from_txn_hash: 'Ad9wNkP7PfiPxyaepCyZAs2hxUnd7XyU6NvoSUzRjoKr',
        from_txn_hash_sig: '4LeqNrWEVo6npHrB8r3NQfQ1JJQMJaaZoPn78oCXLETqNBekfvuvMxWMReEmvAgPYLo34AfJQYyxvXGjVKTmQKZa',
        to_addr: 'XFYAYSEGQIY2J3DCGGXCPXY5FGHSVKM3V4WCNYCLKDLHB7RYDBU233QB5M',
        to_token_id: 3,
        comment: 'something'
    }))

    await pool.query(sql.createRequest({
        from_addr: 'zxcvn.testnet',
        from_amount_atom: '50000',
        from_token_id: 2,
        from_txn_hash: 'AM9YSv5P6rkBf9mVtyDysFCanbgEg6HPRom7qtu4AKbF',
        from_txn_hash_sig: '5xTnBbwSQZqdzqD5LJLkpag8o7ASBMX7ER1vwk1mjLKy6u5TPmNs7AJfQwqkeWbMXMUkxfyhs2FzjpyJbTmqPnQM',
        to_addr: 'NY5PBXI4JAC6AL4SJ4L43ZF3A2LVTP5IQQSVLANGOPTAF3FNSM5OQXRRVI',
        to_token_id: 3,
        comment: null
    }))

    await pool.end()
}

main()