const bs58 = require('bs58')
const crypto = require('crypto')
const fs = require('fs').promises
const yargs = require('yargs/yargs');
const hideBin = require('yargs/helpers').hideBin;


async function sign_txn_hash(txn_hash_base58, ed25519_private_key_base58) {
    let txn_hash_bytes = bs58.decode(txn_hash_base58)
    let ed25519_private_key_bytes = bs58.decode(ed25519_private_key_base58)
    var prefixPrivateEd25519 = Buffer.from('302e020100300506032b657004220420','hex');
    var der = Buffer.concat([prefixPrivateEd25519, ed25519_private_key_bytes]);
    let ed25519_private_key = crypto.createPrivateKey({key: der, format: "der", type: "pkcs8"})
    let sig = crypto.sign(null, txn_hash_bytes, ed25519_private_key) 
    return bs58.encode(sig)
}

module.exports = {sign_txn_hash}

async function main() {
    const argv = hideBin(process.argv)
    console.log(await sign_txn_hash(argv[0], argv[1]))
}

if (require.main == module) {
    main()
}