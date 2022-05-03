// TODO: more txnStatus for internal process like fee calculation
export { BridgeTxnInfo };

import { ApiCallParam, BlockchainName, BridgeTxnStatus } from '../..';
import { BridgeError, ERRORS } from '../../utils/errors';

import { ENV } from '../../utils/dotenv';
import { TxnType } from '..';
import { goNearToAtom } from '../../utils/formatter';

class BridgeTxnInfo {
  dbId?: number;
  fixedFeeAtom?: bigint;
  marginFeeAtom?: bigint;
  timestamp: bigint;
  fromAddr: string;
  fromAmountAtom: bigint;
  fromBlockchain: BlockchainName;
  fromTxnId: string;
  toAddr: string;
  toAmountAtom?: bigint;
  toBlockchain: BlockchainName;
  txnStatus: BridgeTxnStatus;
  toTxnId?: string;
  txnType?: TxnType;

  static fromApiCallParam(
    apiCallParam: ApiCallParam,
    txnType: TxnType,
    timestamp?: bigint
  ): BridgeTxnInfo {
    const { from, to, amount, txnId } = apiCallParam;
    var fromBlockchain: BlockchainName, toBlockchain: BlockchainName;
    timestamp = timestamp ?? BigInt(+Date.now());
    if (txnType === TxnType.MINT) {
      fromBlockchain = BlockchainName.NEAR;
      toBlockchain = BlockchainName.ALGO;
    } else if (txnType === TxnType.BURN) {
      fromBlockchain = BlockchainName.ALGO;
      toBlockchain = BlockchainName.NEAR;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TX_TYPE, {
        txnType,
      });
    }

    const bridgeTxnInfo = new BridgeTxnInfo({
      dbId: undefined,
      fromAmountAtom: goNearToAtom(amount),
      fixedFeeAtom: undefined,
      marginFeeAtom: undefined,
      toAmountAtom: undefined,
      timestamp,
      fromAddr: from,
      fromBlockchain,
      fromTxnId: txnId,
      toAddr: to,
      toBlockchain,
      toTxnId: undefined,
      txnStatus: BridgeTxnStatus.NOT_STARTED,
    });
    return bridgeTxnInfo;
  }

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
    dbId?: number;
    timestamp: bigint;

    fromAddr: string;
    fromAmountAtom: bigint;
    fromBlockchain: BlockchainName;
    fromTxnId: string;

    toAddr: string;
    toAmountAtom?: bigint;
    toBlockchain: BlockchainName;
    toTxnId?: string;

    txnStatus?: BridgeTxnStatus;
    fixedFeeAtom?: bigint;
    marginFeeAtom?: bigint;
    txnType?: TxnType;
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
    this.txnStatus = txnStatus ?? BridgeTxnStatus.NOT_STARTED;
    this.txnType = txnType;
    this.toTxnId = toTxnId;
    this.dbId = dbId;

    this.initiate();
  }

  getToAmountAtom(): bigint {
    if (this.toAmountAtom === undefined) {
      this.initiate();
      this.toAmountAtom = this.calculateToAmountAtom();
    }
    return this.toAmountAtom;
  }

  // methods below are likely to be private
  initiate(): this {
    this.verify();
    this.inferTxnType();
    this.getFixedFeeAtom();
    this.calculateMarginFeeAtom();
    this.calculateToAmountAtom();
    return this;
  }

  verify(): this {
    if (this.fixedFeeAtom === undefined) {
      this.fixedFeeAtom = this.getFixedFeeAtom();
    }

    if (this.fromAmountAtom < this.fixedFeeAtom) {
      throw new BridgeError(ERRORS.INTERNAL.INVALID_AMOUNT, {
        fromAmountAtom: this.fromAmountAtom,
      });
    }

    //TODO: verify address too.

    // we can also do a min/max check here.
    return this;
  }

  inferTxnType(): TxnType {
    var txnType: TxnType;
    if (
      this.fromBlockchain === BlockchainName.ALGO &&
      this.toBlockchain === BlockchainName.NEAR
    ) {
      txnType = TxnType.MINT;
    } else if (
      this.fromBlockchain === BlockchainName.NEAR &&
      this.toBlockchain === BlockchainName.ALGO
    ) {
      txnType = TxnType.BURN;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TX_TYPE, {
        fromBlockchain: this.fromBlockchain,
        toBlockchain: this.toBlockchain,
      });
    }
    this.txnType = txnType;
    return txnType;
  }

  getFixedFeeAtom(): bigint {
    if (this.fixedFeeAtom !== undefined) {
      return this.fixedFeeAtom;
    }
    let fixedFee: bigint;
    if (this.txnType === undefined) {
      this.inferTxnType();
    }
    if (this.txnType === TxnType.MINT) {
      fixedFee = goNearToAtom(ENV.BURN_FIX_FEE);
    } else if (this.txnType === TxnType.BURN) {
      fixedFee = goNearToAtom(ENV.MINT_FIX_FEE);
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TX_TYPE, {
        txnType: this.txnType,
      });
    }

    this.fixedFeeAtom = fixedFee;
    return fixedFee;
  }

  calculateMarginFeeAtom(): bigint {
    if (this.marginFeeAtom !== undefined) {
      return this.marginFeeAtom;
    }

    let marginFee: bigint;
    let marginPercentage: number;

    if (this.fixedFeeAtom === undefined) {
      this.fixedFeeAtom = this.getFixedFeeAtom();
    }
    if (this.txnType === TxnType.MINT) {
      marginPercentage = ENV.MINT_PERCENT_FEE;
    }
    if (this.txnType === TxnType.BURN) {
      marginPercentage = ENV.BURN_PERCENT_FEE;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TX_TYPE, {
        txnType: this.txnType,
      });
    }

    marginFee =
      ((this.fromAmountAtom - this.fixedFeeAtom) *
        BigInt(100 - marginPercentage)) /
        BigInt(100) +
      BigInt(1); // +1 for rounding up

    this.marginFeeAtom = marginFee;
    return marginFee;
  }

  calculateToAmountAtom(): bigint {
    if (this.toAmountAtom !== undefined) {
      return this.toAmountAtom;
    }

    let toAmount: bigint;
    if (this.fixedFeeAtom === undefined) {
      this.fixedFeeAtom = this.getFixedFeeAtom();
    }
    if (this.marginFeeAtom === undefined) {
      this.marginFeeAtom = this.calculateMarginFeeAtom();
    }

    toAmount = this.fromAmountAtom - this.fixedFeeAtom - this.marginFeeAtom;

    this.toAmountAtom = toAmount;
    return toAmount;
  }
}
