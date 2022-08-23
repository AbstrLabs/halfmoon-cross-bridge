import { Blockchain } from "./blockchain/base";

export interface RequestForVerify {
    from_amount_atom: string;
    from_addr: string;
    from_txn_hash: string;
    from_txn_hash_sig: string;

    to_addr: string;
}

export interface VerifyResult {
    valid: boolean;
    to_amount_atom?: string;
    invalidReason?: string;
}

export interface RequestForCreatingOutgoing {
    to_addr: string;
    to_amount_atom: string;
}

export interface RequestForSendingOutgoing {
    to_txn_hash: string;
    to_txn_bytes: Uint8Array;
}

export interface OutgoingResult {
    success: boolean;
    failReason?: string;
}

export interface TokenAndFee {
    from_token_id: number;
    to_token_id: number;
    from_token_name: string;
    to_token_name: string;
    from_token_blockchain: Blockchain;
    to_token_blockchain: Blockchain;
    from_token_addr: string | null;
    to_token_addr: string | null;
    fixed_fee_atom: string;
    margin_fee_atom: string;
}
