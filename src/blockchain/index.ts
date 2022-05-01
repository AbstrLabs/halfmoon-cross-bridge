/* All blockchain functionalities wrapped up with our centralized account */
// TODO: Make singleton
export {
  Blockchain,
  TxType,
  type Addr,
  type AlgoAcc,
  type AlgoAddr,
  type AlgoAssetTransferTxOutcome,
  type AlgoMnemonic,
  type AlgoReceipt,
  type AlgoTxId,
  type AlgoTxOutcome,
  type GenericAcc,
  type NearAcc,
  type NearAddr,
  type NearTxId,
  type NearTxOutcome,
  type TxID,
  type TxOutcome,
  type TxReceipt,
};

import algosdk, { Transaction } from 'algosdk';
import AnyTransaction from 'algosdk/dist/types/src/types/transactions';
import { AssetTransferTransaction } from 'algosdk/dist/types/src/types/transactions/asset';
import { providers } from 'near-api-js';
import { type TxParam } from '..';
import { setImmediateInterval } from '../utils/helper';
import { logger } from '../utils/logger';

type Addr = NearAddr | AlgoAddr;
type AlgoAcc = algosdk.Account;
type AlgoAddr = string;
type AlgoMnemonic = string;
type AlgoReceipt = Transaction;
type AlgoTxId = string;
type GenericAcc = AlgoAcc | NearAcc;
type NearAcc = undefined;
type NearAddr = string;
type NearReceipt = any;
type NearTxId = string;
type TxID = NearTxId | AlgoTxId;
type TxReceipt = AlgoReceipt | NearReceipt;
type NearTxOutcome = providers.FinalExecutionOutcome;
type BigNum = number; // | bigint; // using number now
type AlgoAssetTransferTxOutcome = {
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
    id: AlgoTxId;
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
type AlgoTxOutcome =
  | {
      'current-round': number;
      transaction: AnyTransaction & {
        'confirmed-round': number;
        id: string;
      };
    }
  | AlgoAssetTransferTxOutcome; // TODO: programmatically check if this type is correct.
type TxOutcome = NearTxOutcome | AlgoTxOutcome;
// type TxStatuesOutcome = TxReceipt | AlgoTxOutcome;
type ConfirmTxnConfig = {
  timeoutSec: number;
  intervalSec: number;
};

enum TxType {
  Mint = 'MINT',
  Burn = 'BURN',
}

abstract class Blockchain {
  async confirmTxn(txParam: TxParam): Promise<boolean> {
    logger.silly('Blockchain: confirmTransaction()', txParam);
    const confirmed = new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, this.confirmTxnConfig.timeoutSec * 1000);
      const interval = setImmediateInterval(async () => {
        let txnOutcome = await this.getTxnStatus(
          txParam.txId,
          txParam.fromAddr
        );
        //TODO: error handling
        if (this.verifyCorrectness(txnOutcome, txParam)) {
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
  abstract verifyCorrectness(txnOutcome: TxOutcome, txParam: TxParam): boolean;
  abstract getTxnStatus(txId: TxID, from: Addr): Promise<TxOutcome>; // TODO: use TxParam.
  abstract makeOutgoingTxn(txParam: TxParam): Promise<TxID>;
  // getRecentTransactions(limit: number): Promise<TxID[]>;
}
