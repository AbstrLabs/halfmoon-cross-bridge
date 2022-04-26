/* All blockchain functionalities wrapped up with our centralized account */
// TODO: Make singleton
export {
  type NearAddr,
  type AlgoAddr,
  type Addr,
  type NearTxId,
  type AlgoTxId,
  type TxID,
  type AlgoMnemonic,
  type AlgoAcc,
  type NearAcc,
  type GenericAcc,
  TxType,
  Blockchain,
};

import algosdk from 'algosdk';
import { providers } from 'near-api-js';
import { type GenericTxInfo } from '..';
import { setImmediateInterval } from '../utils/helper';
import { logger } from '../utils/logger';

type NearAddr = string;
type AlgoAddr = string;
type Addr = NearAddr | AlgoAddr;
type NearTxId = string;
type AlgoTxId = string;
type TxID = NearTxId | AlgoTxId;
type AlgoMnemonic = string;
type AlgoReceipt = any;
type NearReceipt = any;
type TxReceipt = AlgoReceipt | NearReceipt;
type TxStatuesOutcome = TxReceipt | providers.FinalExecutionOutcome;
type AlgoAcc = algosdk.Account;
type NearAcc = undefined;
type GenericAcc = AlgoAcc | NearAcc;
type ConfirmTxnConfig = {
  timeoutSec: number;
  intervalSec: number;
};

enum TxType {
  Mint = 'MINT',
  Burn = 'BURN',
}

abstract class Blockchain {
  async confirmTxn(genericTxInfo: GenericTxInfo): Promise<boolean> {
    logger.silly('Blockchain: confirmTransaction()', genericTxInfo);
    const confirmed = new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, this.confirmTxnConfig.timeoutSec * 1000);
      const interval = setImmediateInterval(async () => {
        let txnOutcome = await this.getTxnStatus(
          genericTxInfo.txId,
          genericTxInfo.from
        );
        //TODO: error handling
        if (this.verifyCorrectness(txnOutcome, genericTxInfo)) {
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
    txnOutcome: TxStatuesOutcome,
    genericTxInfo: GenericTxInfo
  ): boolean;
  abstract getTxnStatus(txId: TxID, from: Addr): Promise<TxStatuesOutcome>;
  abstract makeOutgoingTxn(genericTxInfo: GenericTxInfo): Promise<TxID>;
  // getRecentTransactions(limit: number): Promise<TxID[]>;
}
