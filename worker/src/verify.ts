import { TransactionStatus } from "./blockchain/base";
import { RequestForVerify, TokenAndFee, VerifyResult } from "./types";
import { backoff } from "./utils";

export async function verify(request: RequestForVerify, tokenAndFee: TokenAndFee): Promise<VerifyResult> {
    // wait incoming transaction confirmed
    let confirmResult = await backoff(
        5,
        async () => {
            let status = await tokenAndFee.from_token_blockchain.checkTransactionStatus(request.from_txn_hash);
            if (status == TransactionStatus.Failed) {
                // todo: get the real reason
                return { valid: false, invalidReason: "transaction invalid" };
            } else if (status == TransactionStatus.Confirmed) {
                return { valid: true };
            } else {
                // pending
                throw new Error("transaction not finished");
            }
        },
        tokenAndFee.to_token_blockchain.txnGoThroughTime * 1000
    );
    if (!confirmResult.valid) {
        return confirmResult;
    }

    // At this point incoming transaction must be a successful blockchain transaction
    // check incoming transaction is business-logically right: correct receiver, type, etc.
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
        10n ** BigInt(tokenAndFee.from_token_atoms);
    // check fee
    let feeAmount =
        (to_amount_atom_before_fee * BigInt(tokenAndFee.margin_fee_atom)) / 10000n + BigInt(tokenAndFee.fixed_fee_atom);
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
