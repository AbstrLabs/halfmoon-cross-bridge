/* All blockchain functionalities wrapped up with our centralized account */
// TODO: Make singleton
export {
  Blockchain,
  TxType,
  type Addr,
  type AlgoAcc,
  type AlgoAddr,
  type AlgoMnemonic,
  type AlgoReceipt,
  type AlgoTxId,
  type GenericAcc,
  type NearAcc,
  type NearAddr,
  type NearTxId,
  type TxID,
};

import algosdk from 'algosdk';
import { providers } from 'near-api-js';
import { type GenericTxInfo } from '..';
import { setImmediateInterval } from '../utils/helper';
import { logger } from '../utils/logger';

type Addr = NearAddr | AlgoAddr;
type AlgoAcc = algosdk.Account;
type AlgoAddr = string;
type AlgoMnemonic = string;
type AlgoReceipt = any;
type AlgoTxId = string;
type GenericAcc = AlgoAcc | NearAcc;
type NearAcc = undefined;
type NearAddr = string;
type NearReceipt = any;
type NearTxId = string;
type TxID = NearTxId | AlgoTxId;
type TxReceipt = AlgoReceipt | NearReceipt;
type TxStatuesOutcome = TxReceipt | providers.FinalExecutionOutcome;
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
