import { Transaction, TransactionStatus } from "./blockchain/base";
import { TokenAndFee, RequestForCreatingOutgoing, RequestForSendingOutgoing, OutgoingResult } from "./types";
import { backoff } from "./utils";

export async function createOutgoing(request: RequestForCreatingOutgoing, tokenAndFee: TokenAndFee): Promise<Transaction> {
    return await tokenAndFee.to_token_blockchain.createTransactionObject({ ...request, to_token_addr: tokenAndFee.to_token_addr });
}
export async function sendOutgoing(request: RequestForSendingOutgoing, tokenAndFee: TokenAndFee): Promise<OutgoingResult> {
    let status = await tokenAndFee.to_token_blockchain.checkTransactionStatus(request.to_txn_hash);
    if (status == TransactionStatus.NotExist) {
        // not sent, or sending was failed.
        await tokenAndFee.to_token_blockchain.sendTransaction(request.to_txn_bytes);
    }

    return await backoff(5, async () => {
        let status = await tokenAndFee.to_token_blockchain.checkTransactionStatus(request.to_txn_hash);
        if (status == TransactionStatus.Failed) {
            // todo: get the real reason
            return { success: false, failReason: 'failed' };
        } else if (status == TransactionStatus.Confirmed) {
            return { success: true };
        } else {
            // pending
            throw new Error('not finished');
        }
    }, tokenAndFee.to_token_blockchain.txnGoThroughTime * 1000);
}
