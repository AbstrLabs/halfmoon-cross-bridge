import { RequestForVerify, TokenAndFee, VerifyResult } from "./types";

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
    let {from_txn_hash, from_txn_hash_sig}


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
