import { Blockchain, FromToken, FromTxn, Transaction, TransactionParams, TransactionStatus, VerifyResult } from "./base";
import { Algodv2 as AlgodClient, Indexer } from 'algosdk';
import * as algosdk from 'algosdk';

import { env } from "../utils";
import base58, { decode } from "bs58";

class AlgoTransaction extends Transaction {
  constructor(public txn_hash: string, public txn_bytes: Uint8Array) {
    super();
  }
}

class AlgoBlockchain extends Blockchain{
    txnGoThroughTime = 5;
    
    client = new AlgodClient({
      'X-API-KEY': env('PURE_STAKE_API_KEY')
    }, env('PURE_STAKE_ALGOD_URL'), '');
    indexer = new Indexer({
        'X-API-KEY': env('PURE_STAKE_API_KEY')
    }, env('PURE_STAKE_INDEXER_URL'), '');
    centralizedAddr = env('ALGO_MASTER_ADDR');
    centralizedSk = algosdk.mnemonicToSecretKey(
      env('ALGO_MASTER_PASS')
    ).sk;

    private async getTransaction(txn_hash: string): Promise<any> {
      try {
        const outcome = (await this.indexer
          .lookupTransactionByID(txn_hash)
          .do());
        return outcome;
      } catch (err) {
        throw err;
      }
    }

    async verifyIncomingTransaction(fromTxn: FromTxn, fromToken: FromToken): Promise<VerifyResult> {
        let outcome = await this.getTransaction(fromTxn.from_txn_hash);
        const currentRound = outcome['current-round'];
        const txn = outcome.transaction;
        const confirmedRound = txn['confirmed-round'];
        const amount = `${txn['asset-transfer-transaction'].amount}`;
        const sender = txn.sender;
        const receiver = txn['asset-transfer-transaction'].receiver;
        const assetId = txn['asset-transfer-transaction']['asset-id'];
        const pk = algosdk.decodeAddress(sender).publicKey
    
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
          algosdk.decodeAddress(addr)
        } catch (e) {
          return false
        }
        return true
    }

    async createTransactionObject(algoTxnParam: TransactionParams): Promise<AlgoTransaction> {
      const params = await this.client.getTransactionParams().do();
      // comment out the next two lines to use suggested fee
      // params.fee = algosdk.ALGORAND_MIN_TXN_FEE;
      // params.flatFee = true;
      // const enc = new TextEncoder();
      // const note = enc.encode('Hello World');
      const txnConfig = {
        to: algoTxnParam.to_addr,
        from: this.centralizedAddr,
        amount: BigInt(algoTxnParam.to_amount_atom),
        note: undefined, // maybe write the incoming txnId here
        suggestedParams: params,
        assetIndex: Number(algoTxnParam.to_token_addr),
        revocationTarget: undefined,
        closeRemainderTo: undefined,
      };
  
      const txn =
        algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(txnConfig);
  
      // Sign the transaction
      const txnId = txn.txID().toString();
      const rawSignedTxn = txn.signTxn(this.centralizedSk);   
      return new AlgoTransaction(txnId, rawSignedTxn) 
    }
    
    async sendTransaction(t: Uint8Array): Promise<void> {
      await this.client.sendRawTransaction(t).do()
    }

    async checkTransactionStatus(txn_hash: string): Promise<TransactionStatus> {

      let info 
      try {
        info = await this.client.pendingTransactionInformation(txn_hash).do()
      } catch (err: any) {
        if (err.status === 404) {
          // based on api schema, 404 indicate it's not in the pending pool, then it is in indexer
          try {
            await this.getTransaction(txn_hash);
            return TransactionStatus.Confirmed
          } catch (e) {
            // if indexer is down the transaction can be success, in this case throw an error, only we're sure it's really not exist we return that result
            return TransactionStatus.NotExist
          }
        } else {
          throw err
        }
      }
      if(info['confirmed-round']) {
        return TransactionStatus.Confirmed
      } else if (info['pool-error'] == '') {
        return TransactionStatus.Pending
      } else {
        return TransactionStatus.Failed
      }
    }
}

export const algoBlockchain = new AlgoBlockchain()