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

enum TxType {
  Mint = 'mint',
  Burn = 'burn',
}

abstract class Blockchain {
  static confirmTransaction(bridgeTxnParam: BridgeTxnParam): Promise<boolean> {
    throw new Error('not implemented!');
  }
  static getRecentTransactions(limit: number): Promise<TxID[]> {
    throw new Error('not implemented!');
  }
}
