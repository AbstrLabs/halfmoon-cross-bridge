/* All blockchain functionalities wrapped up with our centralized account */

export {
  type nearAddr,
  type algoAddr,
  type addr,
  type nearTxHash,
  type algoTxnId,
  type TxID,
  type algoMnemonic,
  TxType,
  Blockchain,
};

import { type BridgeTxnParam } from '..';

type nearAddr = string;
type algoAddr = string;
type addr = nearAddr | algoAddr;
type nearTxHash = string;
type algoTxnId = string;
type TxID = nearTxHash | algoTxnId;
type algoMnemonic = string;
type AlgoReceipt = any;
type NearReceipt = any;
type GeneralReceipt = AlgoReceipt | NearReceipt;

enum TxType {
  Mint = 'mint',
  Burn = 'burn',
}

interface Blockchain {
  confirmTransaction(bridgeTxnParam: BridgeTxnParam): Promise<boolean>;
  makeTransaction(bridgeTxnParam: BridgeTxnParam): Promise<GeneralReceipt>;
  // getRecentTransactions(limit: number): Promise<TxID[]>;
}
