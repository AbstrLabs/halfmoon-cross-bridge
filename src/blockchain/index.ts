/* All blockchain functionalities wrapped up with our centralized account */
// TODO: Make singleton
export {
  Blockchain,
  ConfirmOutcome,
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
  type TxnId,
  type TxnOutcome,
  type TxnParam,
  type TxnReceipt,
};
export {
  type AlgoTxnParam,
  type BurnApiParam,
  type MintApiParam,
  type NearTxnParam,
} from '../utils/type';

import algosdk, { Transaction } from 'algosdk';
import AnyTransaction from 'algosdk/dist/types/src/types/transactions';
import { type Account, providers } from 'near-api-js';

import {
  AlgoTxnId,
  NearTxnId,
  type AlgoAddr,
  type AlgoTxnParam,
  type NearAddr,
  type NearTxnParam,
} from '../utils/type';
import { setImmediateInterval } from '../utils/helper';
import { logger } from '../utils/logger';

type Addr = AlgoAddr | NearAddr;
type AlgoAcc = algosdk.Account;
type AlgoMnemonic = string;
type AlgoReceipt = Transaction;
type BigNum = number; // | bigint; // using number now
type GenericAcc = AlgoAcc | NearAcc;
type NearAcc = Account;
type NearReceipt = unknown; // TODO: type
type NearTxnOutcome = providers.FinalExecutionOutcome;
type TxnId = AlgoTxnId | NearTxnId;
type TxnParam = AlgoTxnParam | NearTxnParam;
type TxnReceipt = AlgoReceipt | NearReceipt;

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

enum ConfirmOutcome {
  SUCCESS = 'SUCCESS',
  WRONG_INFO = 'WRONG_INFO',
  TIMEOUT = 'TIMEOUT',
}

abstract class Blockchain {
  async confirmTxn(txnParam: TxnParam): Promise<ConfirmOutcome> {
    logger.silly('Blockchain: confirmTransaction()', txnParam);
    const outcome = new Promise<ConfirmOutcome>((resolve) => {
      const timeout = setTimeout(() => {
        resolve(ConfirmOutcome.TIMEOUT);
      }, this.confirmTxnConfig.timeoutSec * 1000);

      const interval = setImmediateInterval(async () => {
        const txnOutcome = await this.getTxnStatus(
          txnParam.txnId,
          txnParam.fromAddr
        );
        let isCorrect;

        try {
          isCorrect = this.verifyCorrectness(txnOutcome, txnParam);
          if (isCorrect) {
            clearTimeout(timeout);
            clearInterval(interval);
            resolve(ConfirmOutcome.SUCCESS);
          } else {
            clearTimeout(timeout);
            clearInterval(interval);
            resolve(ConfirmOutcome.WRONG_INFO);
          }
        } catch (err) {
          clearTimeout(timeout);
          clearInterval(interval);
          resolve(ConfirmOutcome.WRONG_INFO);
          throw err;
        }
      }, this.confirmTxnConfig.intervalSec * 1000);
    });

    return await outcome;
  }

  /* ABSTRACT */
  public abstract readonly centralizedAddr: Addr;
  public abstract readonly confirmTxnConfig: ConfirmTxnConfig;
  public abstract readonly name: string;
  protected abstract readonly centralizedAcc: GenericAcc;

  public abstract verifyCorrectness(
    txnOutcome: TxnOutcome,
    txnParam: TxnParam
  ): boolean;
  public abstract getTxnStatus(txnId: TxnId, from: Addr): Promise<TxnOutcome>; // TODO: use TxnParam.
  public abstract makeOutgoingTxn(txnParam: TxnParam): Promise<TxnId>;

  // getRecentTransactions(limit: number): Promise<TxnID[]>;
}
