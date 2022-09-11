import { RequestForVerify, TokenAndFee, VerifyResult } from "./types";
import bs58 from "bs58";
import crypto, { sign } from 'crypto'

export async function verify(request: RequestForVerify, tokenAndFee: TokenAndFee): Promise<VerifyResult> {
    // check incoming transaction valid
    let verifyResult = await tokenAndFee.from_token_blockchain.verifyIncomingTransaction(request, tokenAndFee)
    if (!verifyResult.valid) {
        return {
            valid: false,
            invalidReason: 'invalid incoming transaction: ' + verifyResult.invalidReason
        };
    }

    // check fee
    let feeAmount = BigInt(request.from_amount_atom) * BigInt(tokenAndFee.margin_fee_atom) + BigInt(tokenAndFee.fixed_fee_atom);
    let to_amount_atom = BigInt(request.from_amount_atom) * BigInt(10) ** BigInt(tokenAndFee.to_token_atoms) / (BigInt(10) ** BigInt(tokenAndFee.from_token_atoms) ) - feeAmount;
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
        to_amount_atom,
    };
}

function verifySignature(signerPublicKey: string, from_txn_hash: string, from_txn_hash_sig: string): boolean {
    try {
        console.log(signerPublicKey)
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