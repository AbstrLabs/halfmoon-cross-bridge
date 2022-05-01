/* All blockchain functionalities wrapped up with our centralized account */
// TODO: Make singleton
export {
  Blockchain,
  TxnType,
  type Addr,
  type AlgoAcc,
  type AlgoAddr,
  type AlgoAssetTransferTxnOutcome,
  type AlgoMnemonic,
  type AlgoReceipt,
  type AlgoTxnId,
  type AlgoTxnOutcome,
  type GenericAcc,
  type NearAcc,
  type NearAddr,
  type NearTxnId,
  type NearTxnOutcome,
  type TxnID,
  type TxnOutcome,
  type TxnReceipt,
};

import algosdk, { Transaction } from 'algosdk';
import AnyTransaction from 'algosdk/dist/types/src/types/transactions';
import { providers } from 'near-api-js';
import { type TxnParam } from '..';
import { setImmediateInterval } from '../utils/helper';
import { logger } from '../utils/logger';

type Addr = NearAddr | AlgoAddr;
type AlgoAcc = algosdk.Account;
type AlgoAddr = string;
type AlgoMnemonic = string;
type AlgoReceipt = Transaction;
type AlgoTxnId = string;
type GenericAcc = AlgoAcc | NearAcc;
type NearAcc = undefined;
type NearAddr = string;
type NearReceipt = any;
type NearTxnId = string;
type TxnID = NearTxnId | AlgoTxnId;
type TxnReceipt = AlgoReceipt | NearReceipt;
type NearTxnOutcome = providers.FinalExecutionOutcome;
type BigNum = number; // | bigint; // using number now
type AlgoAssetTransferTxnOutcome = {
  // from Indexer JSON response
  'current-round': number;
  transaction: {
    'asset-transfer-transaction': {
      amount: BigNum;
      'asset-id': number;
      'close-amount': number;
      receiver: AlgoAddr;
    };
    'close-rewards': BigNum;
    'closing-amount': BigNum;
    'confirmed-round': number;
    fee: BigNum;
    'first-valid': BigNum;
    'genesis-hash': string;
    'genesis-id': 'testnet-v1.0';
    id: AlgoTxnId;
    'intra-round-offset': number;
    'last-valid': number;
    'receiver-rewards': number;
    'round-time': number;
    sender: AlgoAddr;
    'sender-rewards': number;
    signature: {
      sig: string;
    };
    'tx-type': 'axfer';
  };
}; // TODO: programmatically check if this type is correct.
type AlgoTxnOutcome =
  | {
      'current-round': number;
      transaction: AnyTransaction & {
        'confirmed-round': number;
        id: string;
      };
    }
  | AlgoAssetTransferTxnOutcome; // TODO: programmatically check if this type is correct.
type TxnOutcome = NearTxnOutcome | AlgoTxnOutcome;
// type TxnStatuesOutcome = TxnReceipt | AlgoTxnOutcome;
type ConfirmTxnConfig = {
  timeoutSec: number;
  intervalSec: number;
};

enum TxnType {
  MINT = 'MINT',
  BURN = 'BURN',
}

abstract class Blockchain {
  async confirmTxn(txnParam: TxnParam): Promise<boolean> {
    logger.silly('Blockchain: confirmTransaction()', txnParam);
    const confirmed = new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, this.confirmTxnConfig.timeoutSec * 1000);
      const interval = setImmediateInterval(async () => {
        let txnOutcome = await this.getTxnStatus(
          txnParam.txnId,
          txnParam.fromAddr
        );
        //TODO: error handling
        if (this.verifyCorrectness(txnOutcome, txnParam)) {
          clearTimeout(timeout);
          clearInterval(interval);
          resolve(true);
        } else {
          clearTimeout(timeout);
          clearInterval(interval);
          resolve(false);
        }
      }, this.confirmTxnConfig.intervalSec * 1000);
    });
    return await confirmed;
  }
  // Abstract methods
  protected abstract readonly centralizedAcc: GenericAcc;
  abstract readonly confirmTxnConfig: ConfirmTxnConfig;
  abstract verifyCorrectness(
    txnOutcome: TxnOutcome,
    txnParam: TxnParam
  ): boolean;
  abstract getTxnStatus(txnId: TxnID, from: Addr): Promise<TxnOutcome>; // TODO: use TxnParam.
  abstract makeOutgoingTxn(txnParam: TxnParam): Promise<TxnID>;
  // getRecentTransactions(limit: number): Promise<TxnID[]>;
}
