/* All blockchain functionalities wrapped up with our centralized account */

export {
  type NearAddr,
  type AlgoAddr,
  type Addr,
  type NearTxHash,
  type AlgoTxnId,
  type TxID,
  type AlgoMnemonic,
  type AlgoAcc,
  type NearAcc,
  type GenericAcc,
  TxType,
  Blockchain,
};

import algosdk from 'algosdk';
import { type GenericTxInfo } from '..';

type NearAddr = string;
type AlgoAddr = string;
type Addr = NearAddr | AlgoAddr;
type NearTxHash = string;
type AlgoTxnId = string;
type TxID = NearTxHash | AlgoTxnId;
type AlgoMnemonic = string;
type AlgoReceipt = any;
type NearReceipt = any;
type GeneralReceipt = AlgoReceipt | NearReceipt;
type AlgoAcc = algosdk.Account;
type NearAcc = undefined;
type GenericAcc = AlgoAcc | NearAcc;

enum TxType {
  Mint = 'mint',
  Burn = 'burn',
}

abstract class Blockchain {
  protected abstract readonly centralizedAcc: GenericAcc;
  abstract confirmTransaction(genericTxInfo: GenericTxInfo): Promise<boolean>;
  abstract makeTxn(genericTxInfo: GenericTxInfo): Promise<GeneralReceipt>;
  // getRecentTransactions(limit: number): Promise<TxID[]>;
}
