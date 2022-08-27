import { RequestForVerify, TokenAndFee, VerifyResult } from "./types";
import bs58 from "bs58";
import crypto from 'crypto'

export async function verify(request: RequestForVerify, tokenAndFee: TokenAndFee): Promise<VerifyResult> {
    // check incoming transaction valid
    let verifyResult = await tokenAndFee.from_token_blockchain.verifyIncomingTransaction(request.from_txn_hash)
    if (!verifyResult) {
        return {
            valid: false,
            invalidReason: 'invalid incoming transaction',
        };
    }

    // check signature
    let signerPublicKey = verifyResult
    if (!verifySignature(signerPublicKey, request.from_txn_hash, request.from_txn_hash_sig)) {
        return {
            valid: false,
            invalidReason: 'invalid transaction hash signature',
        };
    }

    // check fee
    let feeAmount = BigInt(request.from_amount_atom) * BigInt(tokenAndFee.margin_fee_atom) + BigInt(tokenAndFee.fixed_fee_atom);
    let to_amount_atom = BigInt(request.from_amount_atom) - feeAmount;
    if (to_amount_atom <= 0n) {
        return {
            valid: false,
            invalidReason: 'insufficient amount',
        };
    }

    // check to address valid
    if (!await tokenAndFee.to_token_blockchain.addressIsValid(request.to_addr)) {
        return {
            valid: false,
            invalidReason: 'invalid to address',
        };
    }

    return {
        valid: true,
        to_amount_atom: to_amount_atom.toString()
    };
}

function verifySignature(signerPublicKey: string, from_txn_hash: string, from_txn_hash_sig: string): boolean {
    try {
        let [keyType, keyData] = signerPublicKey.split(':');
        switch (keyType) {
            case 'ed25519':
                let bytes = bs58.decode(keyData)
                const prefix = Buffer.from('302a300506032b6570032100', 'hex')
                let key = Buffer.concat([prefix, bytes])
                let pk = crypto.createPublicKey({key, format: "der", type: "spki"})
                return crypto.verify(null, bs58.decode(from_txn_hash), pk, bs58.decode(from_txn_hash_sig))
            default:
                return false
        }
    } catch (err) {
        return false
    }
}