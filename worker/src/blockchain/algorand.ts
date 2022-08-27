import { Blockchain, FromToken, FromTxn, Transaction, TransactionParams, TransactionStatus, VerifyResult } from "./base";
import { Algodv2 as AlgodClient, Indexer, decodeAddress } from 'algosdk';
import { env } from "../utils";
import base58, { decode } from "bs58";

class AlgoTransaction extends Transaction {

}

class AlgoBlockchain extends Blockchain{
    txnGoThroughTime = 5;
    indexer = new Indexer({
        'X-API-KEY': env('PURE_STAKE_API_KEY')
    }, env('PURE_STAKE_INDEXER_URL'));
    centralizedAddr = env('ALGO_MASTER_ADDR');

    async verifyIncomingTransaction(fromTxn: FromTxn, fromToken: FromToken): Promise<VerifyResult> {
        let outcome;
        try {
            outcome = (await this.indexer
              .lookupTransactionByID(fromTxn.from_txn_hash)
              .do())
        } catch (err) {
            throw err;
        }

        const currentRound = outcome['current-round'];
        const txn = outcome.transaction;
        const confirmedRound = txn['confirmed-round'];
        const amount = `${txn['asset-transfer-transaction'].amount}`;
        const sender = txn.sender;
        const receiver = txn['asset-transfer-transaction'].receiver;
        const assetId = txn['asset-transfer-transaction']['asset-id'];
        const pk = decodeAddress(sender).publicKey
    
        // verify confirmed
        if (!(currentRound >= confirmedRound)) {
          return {valid: false, invalidReason: 'not confirmed'};
        }
        // compare assetId
        if (assetId !== fromToken.from_token_addr) {
          return {valid: false, invalidReason: 'assetId not match'};
        }
        // compare sender
        if (sender !== fromTxn.from_addr) {
          return {valid: false, invalidReason: 'sender not match'};
        }
        // compare receiver
        if (receiver !== this.centralizedAddr) {
          return {valid: false, invalidReason: 'receiver is no custody'};
        }
        // compare amount
        if (amount !== fromTxn.from_amount_atom) {
          return {valid: false, invalidReason: 'amount not match'};
        }
        // algorand always use ed25519 public key
        return {valid: true, signerPk: 'ed25519:' + base58.encode(pk)};
    }

    async addressIsValid(addr: string): Promise<boolean> {
        try {
          decodeAddress(addr)
        } catch (e) {
          return false
        }
        return true
    }
    
    async createTransactionObject(params: TransactionParams): Promise<AlgoTransaction> {
      return new AlgoTransaction();
    }
    async sendTransaction(t: Uint8Array): Promise<void> {
        
    }
    async checkTransactionStatus(txn_hash: string): Promise<TransactionStatus> {
        return TransactionStatus.NotExist;
    }
}

export const algoBlockchain = new AlgoBlockchain()