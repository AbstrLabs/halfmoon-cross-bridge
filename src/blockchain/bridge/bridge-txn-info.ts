export { BridgeTxnInfo };

import { BlockchainName, BridgeTxnStatus } from '../..';

import { TxnType } from '..';

class BridgeTxnInfo {
  dbId?: number;
  fixedFeeAtom: bigint;
  marginFeeAtom: bigint;
  timestamp: bigint;
  fromAddr: string;
  fromAmountAtom: bigint;
  fromBlockchain: BlockchainName;
  fromTxnId: string;
  toAddr: string;
  toAmountAtom: bigint;
  toBlockchain: BlockchainName;
  toTxnId?: string;
  txnStatus: BridgeTxnStatus;
  txnType?: TxnType;

  constructor({
    fixedFeeAtom,
    marginFeeAtom,
    timestamp,
    fromAddr,
    fromAmountAtom,
    fromBlockchain,
    fromTxnId,
    toAddr,
    toAmountAtom,
    toBlockchain,
    txnStatus,
    txnType,
    toTxnId,
    dbId,
  }: {
    fixedFeeAtom: bigint;
    marginFeeAtom: bigint;
    timestamp: bigint;
    fromAddr: string;
    fromAmountAtom: bigint;
    fromBlockchain: BlockchainName;
    fromTxnId: string;
    toAddr: string;
    toAmountAtom: bigint;
    toBlockchain: BlockchainName;
    txnStatus: BridgeTxnStatus;
    txnType?: TxnType;
    toTxnId?: string;
    dbId?: number;
  }) {
    this.fixedFeeAtom = fixedFeeAtom;
    this.marginFeeAtom = marginFeeAtom;
    this.timestamp = timestamp;
    this.fromAddr = fromAddr;
    this.fromAmountAtom = fromAmountAtom;
    this.fromBlockchain = fromBlockchain;
    this.fromTxnId = fromTxnId;
    this.toAddr = toAddr;
    this.toAmountAtom = toAmountAtom;
    this.toBlockchain = toBlockchain;
    this.txnStatus = txnStatus;
    this.txnType = txnType;
    this.toTxnId = toTxnId;
    this.dbId = dbId;
  }
}
