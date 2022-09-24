import { RequestForVerify, TokenAndFee, VerifyResult } from "./types";
import bs58 from "bs58";
import crypto from "crypto";

export async function verify(request: RequestForVerify, tokenAndFee: TokenAndFee): Promise<VerifyResult> {
    // check incoming transaction valid
    let verifyIncomingResult = await tokenAndFee.from_token_blockchain.verifyIncomingTransaction(request);
    if (!verifyIncomingResult.valid) {
        return {
            valid: false,
            invalidReason: "invalid incoming transaction: " + verifyIncomingResult.invalidReason,
        };
    }

    // check from token matches
    if (verifyIncomingResult.successData!.from_token_addr != tokenAndFee.from_token_addr) {
        return {
            valid: false,
            invalidReason: "to token address does not match",
        };
    }

    let to_amount_atom_before_fee =
        (verifyIncomingResult.successData!.from_amount_atom * 10n ** BigInt(tokenAndFee.to_token_atoms)) /
        10n ** BigInt(tokenAndFee.from_token_atoms)
    // check fee
    let feeAmount = to_amount_atom_before_fee * BigInt(tokenAndFee.margin_fee_atom) / 10000n +
        BigInt(tokenAndFee.fixed_fee_atom);
    console.log(to_amount_atom_before_fee)
    console.log(tokenAndFee)
    console.log(feeAmount)
    let to_amount_atom = to_amount_atom_before_fee - feeAmount;
    if (to_amount_atom <= 0n) {
        return {
            valid: false,
            invalidReason: "insufficient amount",
        };
    }

    // check to blockchain matches
    if (verifyIncomingResult.successData!.to_blockchain != tokenAndFee.to_token_blockchain.name) {
        return {
            valid: false,
            invalidReason: "to blockchain does not match",
        };
    }

    // check to address valid
    if (!(await tokenAndFee.to_token_blockchain.addressIsValid(verifyIncomingResult.successData!.to_addr))) {
        return {
            valid: false,
            invalidReason: "invalid to address",
        };
    }

    return {
        valid: true,
        successData: {
            to_addr: verifyIncomingResult.successData!.to_addr,
            from_amount_atom: verifyIncomingResult.successData!.from_amount_atom,
            to_amount_atom,
        },
    };
}

function verifySignature(signerPublicKey: string, from_txn_hash: string, from_txn_hash_sig: string): boolean {
    try {
        console.log(signerPublicKey);
        let [keyType, keyData] = signerPublicKey.split(":");
        switch (keyType) {
            case "ed25519":
                let bytes = bs58.decode(keyData);
                const prefix = Buffer.from("302a300506032b6570032100", "hex");
                let key = Buffer.concat([prefix, bytes]);
                let pk = crypto.createPublicKey({ key, format: "der", type: "spki" });
                return crypto.verify(null, bs58.decode(from_txn_hash), pk, bs58.decode(from_txn_hash_sig));
            default:
                return false;
        }
    } catch (err) {
        return false;
    }
}
