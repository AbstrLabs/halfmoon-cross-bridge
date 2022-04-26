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

enum TxType {
  Mint = 'MINT',
  Burn = 'BURN',
}

abstract class Blockchain {
  protected abstract readonly centralizedAcc: GenericAcc;
  abstract confirmTransaction(genericTxInfo: GenericTxInfo): Promise<boolean>;
  abstract verifyCorrectness(
    txnOutcome: TxStatuesOutcome,
    genericTxInfo: GenericTxInfo
  ): boolean;
  abstract getTxnStatus(txId: TxID, from: Addr): Promise<TxStatuesOutcome>;
  abstract makeOutgoingTxn(genericTxInfo: GenericTxInfo): Promise<TxID>;
  // getRecentTransactions(limit: number): Promise<TxID[]>;
}
