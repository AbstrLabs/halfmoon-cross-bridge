/* All blockchain functionalities wrapped up
 * with
 * 1. our centralized account (private key)
 * 2. client (to make transaction)
 * 3. indexer (to confirm transaction)
 */

export {
  Blockchain,
  ConfirmOutcome,
  TxnType,
  type AlgoAcc,
  type AlgoAddr,
  type AlgoTxnId,
  type AlgoTxnOutcome,
  type GenericAcc,
  type NearAcc,
  type NearAddr,
  type NearTxnId,
  type NearTxnOutcome,
  type TxnOutcome,
};

import algosdk from 'algosdk';
import AnyTransaction from 'algosdk/dist/types/src/types/transactions';
import { type Account, providers } from 'near-api-js';

import {
  type Addr,
  type AlgoTxnId,
  type NearTxnId,
  type TxnId,
  type AlgoAddr,
  type NearAddr,
  TxnParam,
  AlgoAssetTransferTxnOutcome,
} from '../utils/type';
import { setImmediateInterval } from '../utils/helper';
import { logger } from '../utils/logger';

type AlgoAcc = algosdk.Account;
type NearAcc = Account;
type GenericAcc = AlgoAcc | NearAcc;
type AlgoIndexer = algosdk.Indexer;
type NearIndexer = providers.JsonRpcProvider;
type Indexer = AlgoIndexer | NearIndexer;

type AlgoTxnOutcome =
  | {
      'current-round': number;
      transaction: AnyTransaction & {
        'confirmed-round': number;
        id: string;
      };
    }
  | AlgoAssetTransferTxnOutcome;
type NearTxnOutcome = providers.FinalExecutionOutcome; // TODO: Type FinalExecutionOutcome.transaction.
type TxnOutcome = NearTxnOutcome | AlgoTxnOutcome;

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
        const txnOutcome = await this.getTxnStatus(txnParam);
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
  protected abstract indexer: Indexer;
  protected abstract readonly centralizedAcc: GenericAcc;

  public abstract verifyCorrectness(
    txnOutcome: TxnOutcome,
    txnParam: TxnParam
  ): boolean;
  public abstract getTxnStatus(txnParam: TxnParam): Promise<TxnOutcome>;
  public abstract makeOutgoingTxn(txnParam: TxnParam): Promise<TxnId>;

  // getRecentTransactions(limit: number): Promise<TxnID[]>;
}
