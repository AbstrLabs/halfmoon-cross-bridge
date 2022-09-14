import { Blockchain } from "./blockchain/base";

export interface RequestForVerify {
    from_addr: string;
    from_txn_hash: string;
}

export type VerifyIncomingResult = {
    valid: boolean;
    invalidReason?: string;
    successData?: VerifyIncomingSuccessData;
};

export type VerifyIncomingSuccessData = {
    from_amount_atom: bigint;
    from_token_addr: string | null;
    to_blockchain: string;
    to_addr: string;
};

export type VerifyResult = {
    valid: boolean;
    invalidReason?: string;
    successData?: VerifySuccessData;
};

export type VerifySuccessData = {
    from_amount_atom: bigint;
    to_amount_atom: bigint;
    to_addr: string;
};

export interface RequestForCreatingOutgoing {
    to_addr: string;
    to_amount_atom: bigint;
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
    from_token_atoms: number;
    to_token_atoms: number;
    fixed_fee_atom: string;
    margin_fee_atom: string;
}
