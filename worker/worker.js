// verify incoming transaction, outcoming addr, calculate amount
async function verify() {
    // fetch from incoming blockchain
        // failed to fetch: verify error
        // doesn't exist: verify invalid
    await verify_signature();
    await verify_incoming_transaction();
    await verify_to_address_valid();
    await calculate_to_amount_atom();
}

async function verify_signature(signature, public_key) {
    // blockchain independant

}

async function calculate_to_amount_atom() {
    // blockchain independant
}


async function main() {
    while (true) {
        try {
        // SELECT FOR UPDATE SKIP LOCKED
        // fetch from blockchain
            verify()
            do_outcoming()
        } catch (err) {

        }
    }
}

async function do_outcoming() {
// do the outcoming transaction
async function calculate_outcoming_transaction() {
    // calculate to_txn_hash and store to database before send_outcoming
    // if our worker accidentally stops, there isn't risk to have outcoming transaction send from user
    // if restart from stop and status is DOING_OUTGOING, we can check_outcoming_transaction_status from blockchain to tell if it's sent
}

async function send_outcoming_transaction() {

}

async function check_outcoming_transaction_status() {

}
}



// helper
async function update_status(from, to, data) {
    // from: CREATED, to: INVALID, data: invalid reason
    // from: CREATED, to: DONE_VERIFY, data: to_amount_atom
    // from: CREATED, to: ERROR_IN_VERIFY, data: error message
    // from: DONE_VERIFY, to: DOING_OUTGOING, data: to_txn_hash
    // from: DOING_OUTGOING, to: DONE_OUTGOING
    // from: DOING_OUTGOING, to: ERROR_IN_OUTGOING, data: error message
}
