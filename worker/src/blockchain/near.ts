import { env } from "../utils";
import { Blockchain, FromToken, FromTxn, Transaction, TransactionParams, TransactionStatus, VerifyResult } from "./base";
import {
    type Near,
    Account,
    connect,
    KeyPair,
    keyStores,
    providers,
    transactions,
  } from 'near-api-js';
import { NearConfig } from "near-api-js/lib/near";
import base58 from "bs58";
import { JsonRpcProvider, TypedError } from "near-api-js/lib/providers";
const { unreachable } = require('artificio-bridge-common/error');

class NearAccount extends Account {
    public signTx(receiverId: string, actions: transactions.Action[]): Promise<[Uint8Array, transactions.SignedTransaction]> {
        return this.signTransaction(receiverId, actions)
    }
}

class NearTransaction extends Transaction {
    constructor(public txn_hash: string, public txn_bytes: Uint8Array) {
      super();
    }
  }
class NearBlockchain extends Blockchain {
    txnGoThroughTime = 3;
    centralizedAccount = env('NEAR_MASTER_ADDR')
    keyStore: keyStores.KeyStore;
    config: NearConfig;

    constructor() {
        super()
        this.keyStore = new keyStores.InMemoryKeyStore();
        this.config = {keyStore: this.keyStore, networkId: env('NEAR_NETWORK'), nodeUrl: env('NEAR_RPC_URL'), headers: {}};
    }

    async addressIsValid(addr: string): Promise<boolean> {
        if (addr.length < 2 || addr.length > 64 || !addr.match(/^(([a-z\d]+[\-_])*[a-z\d]+\.)*([a-z\d]+[\-_])*[a-z\d]+$/)) {
            return false;
        }
        return true
    }

    async createTransactionObject(params: TransactionParams): Promise<Transaction> {
        let near = await this.connect();
        const account = await near.account(this.centralizedAccount) as NearAccount;
        if (params.to_token_addr != null) {
            throw new Error('NEP-141 tokens not yet supported')
        }
        let [txn_hash_bytes, signed_txn] = await account.signTx(params.to_addr, [transactions.transfer(params.to_amount_atom)])
        return new NearTransaction(base58.encode(txn_hash_bytes), signed_txn.encode())
    }

    async sendTransaction(t: Uint8Array): Promise<void> {
        let near = await this.connect();
        let provider = near.connection.provider as JsonRpcProvider;
        await provider.sendJsonRpc('broadcast_tx_async', [Buffer.from(t).toString('base64')]);
    }

    async checkTransactionStatus(txn_hash: string): Promise<TransactionStatus> {
        let near = await this.connect();
        let provider = near.connection.provider as JsonRpcProvider;
        let txnOutcome;
        try {
            txnOutcome = await provider.txStatus(txn_hash, this.centralizedAccount);

        } catch (err: any) {
            if(/Transaction .*? doesn't exist/.test(err.message)) {
                return TransactionStatus.NotExist
            }
            throw err;
        }
        if (txnOutcome.status instanceof Object) {
            if (txnOutcome.status.Failure !== undefined) {
                return TransactionStatus.Failed
            } else {
                return TransactionStatus.Confirmed
            }
          } else {
            if (txnOutcome.status === providers.FinalExecutionStatusBasic.NotStarted ||
                txnOutcome.status === providers.FinalExecutionStatusBasic.Started) {
                return TransactionStatus.Pending
            } else if (txnOutcome.status === providers.FinalExecutionStatusBasic.Failure) {
                return TransactionStatus.Failed
            }
            unreachable()
          }
    }

    async verifyIncomingTransaction(fromTxn: FromTxn, fromToken: FromToken): Promise<VerifyResult> {
        throw new Error("Method not implemented.");
    }

    private async connect() {
        const centralizedAccPrivKey = env('NEAR_MASTER_PRIV')
        const keyPair = KeyPair.fromString(centralizedAccPrivKey);
        await this.keyStore.setKey(env('NEAR_NETWORK'), this.centralizedAccount, keyPair);
        return await connect(this.config);
    }
}

export const nearBlockchain = new NearBlockchain()