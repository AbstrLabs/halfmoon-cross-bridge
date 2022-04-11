/* All blockchain functionalities wrapped up with our centralized account */

export {
  type NearAddr,
  type AlgoAddr,
  type Addr,
  type NearTxHash,
  type AlgoTxnId,
  type TxID,
  type AlgoMnemonic,
  TxType,
  Blockchain,
};

import { type GeneralTxInfo } from '..';

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

enum TxType {
  Mint = 'mint',
  Burn = 'burn',
}

interface Blockchain {
  confirmTransaction(bridgeTxnParam: GeneralTxInfo): Promise<boolean>;
  makeTransaction(bridgeTxnParam: GeneralTxInfo): Promise<GeneralReceipt>;
  // getRecentTransactions(limit: number): Promise<TxID[]>;
}
