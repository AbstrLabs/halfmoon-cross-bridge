/**
 * Type definitions for the blockchain module.
 * Abstract class {@link Blockchain}.
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
// TODO(#TNFT): Type FinalExecutionOutcome.transaction.
type NearTxnOutcome = providers.FinalExecutionOutcome;
type TxnOutcome = NearTxnOutcome | AlgoTxnOutcome;

interface ConfirmTxnConfig {
  timeoutSec: number;
  intervalSec: number;
}

enum TxnType {
  MINT = 'MINT',
  BURN = 'BURN',
}

enum ConfirmOutcome {
  SUCCESS = 'SUCCESS',
  WRONG_INFO = 'WRONG_INFO',
  TIMEOUT = 'TIMEOUT',
}

/**
 * All blockchain functionalities wrapped up with
 *
 * 1. our centralized account (private key / passphrase)
 * 2. client (to make transaction)
 * 3. indexer (to confirm transaction)
 *
 * @abstract
 * @classdesc Abstract of all Blockchain classes.
 */
abstract class Blockchain {
  async confirmTxn(txnParam: TxnParam): Promise<ConfirmOutcome> {
    logger.silly('Blockchain: confirmTransaction()', txnParam);
    const outcome = new Promise<ConfirmOutcome>((resolve) => {
      // let interval:NodeJS.Timer;
      let txnOutcome: TxnOutcome | undefined;
      const timeout = setTimeout(() => {
        // hoist interval or move this to the end
        clearInterval(interval);
        resolve(ConfirmOutcome.TIMEOUT);
      }, this.confirmTxnConfig.timeoutSec * 1000);
      const interval = setImmediateInterval(async () => {
        let isCorrect;
        try {
          txnOutcome = await this.getTxnStatus(txnParam);
        } catch (err) {
          logger.error('Blockchain: confirmTransaction()', err);
          return; // run next interval
        }
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
          // TODO: use BridgeError
          // TODO: this system cannot handle the three cases. need rework.
          console.log('err : ', err); // DEV_LOG_TO_REMOVE
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
  /**
   * @param  {TxnOutcome} txnOutcome
   * @param  {TxnParam} txnParam
   *
   * @todo: rename var names to expected, received.
   * @returns boolean
   */
  public abstract verifyCorrectness(
    txnOutcome: TxnOutcome,
    txnParam: TxnParam
  ): boolean;
  public abstract getTxnStatus(txnParam: TxnParam): Promise<TxnOutcome>;
  public abstract makeOutgoingTxn(txnParam: TxnParam): Promise<TxnId>;

  // getRecentTransactions(limit: number): Promise<TxnID[]>;
}
