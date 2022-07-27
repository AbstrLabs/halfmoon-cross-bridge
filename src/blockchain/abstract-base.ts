/**
 * Type definitions for the blockchain module.
 * Abstract class {@link Blockchain}.
 *
 * @todo Move types to src/common/src/type/blockchain.ts
 */

export type {
  AlgoAcc,
  AlgoTxnOutcome,
  GenericAcc,
  NearAcc,
  NearTxnOutcome,
  TxnOutcome,
};
export {
  Blockchain, // abstract class
  ConfirmOutcome,
};

import algosdk from 'algosdk';
import AnyTransaction from 'algosdk/dist/types/src/types/transactions';
import { type Account, providers } from 'near-api-js';

import { setImmediateInterval } from '../utils/helper';
import { BlockchainName } from '..';
import { log } from '../utils/log/log-template';
import {
  Addr,
  AlgoAssetTransferTxnOutcome,
  TxnId,
  TxnParam,
} from '../common/src/type/blockchain';

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
// TODO [TNFT]: Type FinalExecutionOutcome.transaction.
type NearTxnOutcome = providers.FinalExecutionOutcome;
type TxnOutcome = NearTxnOutcome | AlgoTxnOutcome;

interface ConfirmTxnConfig {
  timeoutSec: number;
  intervalSec: number;
}

enum ConfirmOutcome {
  SUCCESS = 'SUCCESS',
  WRONG_INFO = 'WRONG_INFO',
  TIMEOUT = 'TIMEOUT',
}

/**
 * Abstract base class of all Blockchain classes, wrapping up all following functionalities of a blockchain
 *
 * 1. our centralized account (private key / passphrase)
 * 2. client (to make transaction)
 * 3. indexer (to confirm transaction)
 *
 * @todo this implementation seems correct but it had an error.
 * @virtual
 */
abstract class Blockchain {
  async confirmTxn(txnParam: TxnParam): Promise<ConfirmOutcome> {
    log.BLCH.confirmTxn(this.name, txnParam);
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
          log.BLCH.confirmTxnError(this.name, txnParam, err);
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
          // TODO [ERR]: use BridgeError
          // TODO: this system cannot handle the three cases. need rework.
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
  /** @virtual */
  public abstract readonly centralizedAddr: Addr;
  /** @virtual */
  public abstract readonly confirmTxnConfig: ConfirmTxnConfig;
  /** @virtual */
  public abstract readonly name: BlockchainName;
  /** @virtual */
  protected abstract indexer: Indexer;
  /** @virtual */
  protected abstract readonly centralizedAcc: GenericAcc;
  /**
   * @param txnOutcome - Transaction outcome
   * @param txnParam - Transaction parameter
   *
   * @todo rename var names to expected, received.
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
