export abstract class Transaction {
    public abstract txn_hash: string;
    public abstract txn_bytes: Uint8Array;
}

export enum TransactionStatus {
    NotExist,
    Pending,
    Confirmed,
    Failed,
}

export interface TransactionParams {
    to_addr: string;
    to_amount_atom: string;
    to_token_addr: string | null;
}

export type VerifyResult = {
    valid: boolean;
    invalidReason?: string;
    signerPk?: string;
}

export interface FromToken {
    from_token_id: number;
    from_token_name: string;
    from_token_addr: string | null;
}

export interface FromTxn {
    from_amount_atom: string;
    from_addr: string;
    from_txn_hash: string;
}

export abstract class Blockchain {
    abstract txnGoThroughTime: number;
    // used in verify
    abstract verifyIncomingTransaction(fromTxn: FromTxn, fromToken: FromToken): Promise<VerifyResult>;
    abstract addressIsValid(addr: string): Promise<boolean>;
    // used in createOutgoing
    abstract createTransactionObject(params: TransactionParams): Promise<Transaction>;
    // used in sendOutgoing
    abstract sendTransaction(t: Uint8Array): Promise<void>;
    abstract checkTransactionStatus(txn_hash: string): Promise<TransactionStatus>;
}