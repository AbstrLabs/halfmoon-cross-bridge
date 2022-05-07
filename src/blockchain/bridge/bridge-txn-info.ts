// TODO: (next line) more txnStatus for internal process like fee calculation.
// TODO: 1. (DONE)
// TODO: 2. (DONE)
// TODO: 3. rename field timestamp to createTime

export { BridgeTxn };

import { ApiCallParam, BlockchainName, BridgeTxnStatus } from '../..';
import { BridgeError, ERRORS } from '../../utils/errors';

import { ENV } from '../../utils/dotenv';
import { TxnType } from '..';
import { goNearToAtom } from '../../utils/formatter';

class BridgeTxn {
  dbId?: number;
  fixedFeeAtom?: bigint;
  marginFeeAtom?: bigint;
  timestamp: bigint;
  fromAddr: string;
  fromAmountAtom: bigint;
  fromBlockchain?: BlockchainName;
  fromTxnId: string;
  toAddr: string;
  toAmountAtom?: bigint;
  toBlockchain?: BlockchainName;
  txnStatus: BridgeTxnStatus;
  toTxnId?: string;
  txnType?: TxnType;

  static fromApiCallParam(
    apiCallParam: ApiCallParam,
    txnType: TxnType,
    timestamp?: bigint
  ): BridgeTxn {
    const { from, to, amount, txnId } = apiCallParam;
    const bridgeTxn = new BridgeTxn({
      dbId: undefined,
      txnType,
      fixedFeeAtom: undefined,
      fromAddr: from,
      fromAmountAtom: goNearToAtom(amount),
      fromBlockchain: undefined,
      fromTxnId: txnId,
      marginFeeAtom: undefined,
      timestamp,
      toAddr: to,
      toAmountAtom: undefined,
      toBlockchain: undefined,
      toTxnId: undefined,
      txnStatus: BridgeTxnStatus.DOING_INITIALIZE,
    });
    return bridgeTxn;
  }

  // TODO: have a DbItem interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDbItem(dbItem: any, dbType: TxnType): BridgeTxn {
    const bridgeTxn: BridgeTxn = new BridgeTxn({
      dbId: dbItem.db_id,
      txnType: dbType,

      fixedFeeAtom: BigInt(dbItem.fixed_fee_atom),
      fromAddr: dbItem.from_addr,
      fromAmountAtom: BigInt(dbItem.from_amount_atom),
      fromBlockchain: undefined,
      fromTxnId: dbItem.from_txn_id,
      marginFeeAtom: BigInt(dbItem.margin_fee_atom),
      timestamp: BigInt(dbItem.create_time),
      toAddr: dbItem.to_addr,
      toAmountAtom: BigInt(dbItem.to_amount_atom),
      toBlockchain: undefined,
      toTxnId: dbItem.to_txn_id,
      txnStatus: dbItem.txn_status,
    });
    return bridgeTxn;
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
    timestamp?: bigint;

    fromAddr: string;
    fromAmountAtom: bigint;
    fromBlockchain?: BlockchainName;
    fromTxnId: string;

    toAddr: string;
    toAmountAtom?: bigint;
    toBlockchain?: BlockchainName;
    toTxnId?: string;

    txnStatus?: BridgeTxnStatus;
    fixedFeeAtom?: bigint;
    marginFeeAtom?: bigint;
    txnType?: TxnType;
  }) {
    this.fixedFeeAtom = fixedFeeAtom;
    this.marginFeeAtom = marginFeeAtom;
    this.timestamp = timestamp ?? BigInt(+Date.now());
    this.fromAddr = fromAddr;
    this.fromAmountAtom = fromAmountAtom;
    this.fromBlockchain = fromBlockchain;
    this.fromTxnId = fromTxnId;
    this.toAddr = toAddr;
    this.toAmountAtom = toAmountAtom;
    this.toBlockchain = toBlockchain;
    this.txnStatus = txnStatus ?? BridgeTxnStatus.DOING_INITIALIZE;
    this.txnType = txnType;
    this.toTxnId = toTxnId;
    this.dbId = dbId;

    try {
      this.initiate();
    } catch (e) {
      this.txnStatus = BridgeTxnStatus.ERR_INITIALIZE;
      // TODO: upload to db
      throw e;
    }
  }

  getToAmountAtom(): bigint {
    if (this.toAmountAtom === undefined) {
      this.initiate();
      this.toAmountAtom = this.calculateToAmountAtom();
    }
    return this.toAmountAtom;
  }
  /**
   * @param  {BridgeTxn} other
   * @returns {boolean} true if the two BridgeTxn are considered same
   *
   * @todo: Bigint with jest https://github.com/facebook/jest/issues/11617#issuecomment-1068732414
   */
  equals(other: BridgeTxn): boolean {
    return (
      this.fromAddr === other.fromAddr &&
      this.fromAmountAtom.toString() === other.fromAmountAtom.toString() &&
      this.fromBlockchain === other.fromBlockchain &&
      this.fromTxnId === other.fromTxnId &&
      this.toAddr === other.toAddr &&
      //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.toAmountAtom!.toString() === other.toAmountAtom!.toString() &&
      this.toBlockchain === other.toBlockchain &&
      this.toTxnId === other.toTxnId &&
      this.txnStatus === other.txnStatus &&
      this.txnType === other.txnType &&
      this.dbId === other.dbId &&
      //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.fixedFeeAtom!.toString() === other.fixedFeeAtom!.toString() &&
      //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.marginFeeAtom!.toString() === other.marginFeeAtom!.toString() &&
      this.timestamp.toString() === other.timestamp.toString()
    );
  }

  // methods below are likely to be private

  /**
   * Initiate the BridgeTxn.
   * Most fields are readonly, and are defined after initiate().
   * 3 Exceptions: `dbId`, `toTxnId` are allowed to be assigned once.
   * Field `txnStatus` is allowed to be assigned by the ${@link enum BridgeTxnStatus}.
   *
   * @returns {BridgeTxn} this
   *
   * TODO: link the enum BridgeTxnStatus from ${REPO_ROOT}/index.ts
   */
  initiate(): this {
    this.verify();
    this.inferTxnType();
    this.inferBlockchainNames();
    this.getFixedFeeAtom();
    this.calculateMarginFeeAtom();
    this.calculateToAmountAtom();
    this.txnStatus = BridgeTxnStatus.DONE_INITIALIZE;
    return this;
  }

  verify(): this {
    if (
      (this.fromBlockchain === undefined || this.toBlockchain === undefined) &&
      this.txnType === undefined
    ) {
      throw new BridgeError(ERRORS.INTERNAL.INVALID_BRIDGE_TXN_PARAM);
    }

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

  inferBlockchainNames(): {
    fromBlockchain: BlockchainName;
    toBlockchain: BlockchainName;
  } {
    if (this.fromBlockchain !== undefined && this.toBlockchain !== undefined) {
      return {
        fromBlockchain: this.fromBlockchain,
        toBlockchain: this.toBlockchain,
      };
    }

    let fromBlockchain: BlockchainName;
    let toBlockchain: BlockchainName;
    if (this.txnType === TxnType.MINT) {
      fromBlockchain = BlockchainName.NEAR;
      toBlockchain = BlockchainName.ALGO;
    } else if (this.txnType === TxnType.BURN) {
      fromBlockchain = BlockchainName.ALGO;
      toBlockchain = BlockchainName.NEAR;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
        txnType: this.txnType,
      });
    }
    this.fromBlockchain = fromBlockchain;
    this.toBlockchain = toBlockchain;
    return { fromBlockchain, toBlockchain };
  }

  inferTxnType(): TxnType {
    if (this.txnType !== undefined) {
      if (!(this.txnType in TxnType)) {
        throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
          txnType: this.txnType,
        });
      }
      return this.txnType;
    }
    let txnType: TxnType;
    if (
      this.fromBlockchain === BlockchainName.NEAR &&
      this.toBlockchain === BlockchainName.ALGO
    ) {
      txnType = TxnType.MINT;
    } else if (
      this.fromBlockchain === BlockchainName.ALGO &&
      this.toBlockchain === BlockchainName.NEAR
    ) {
      txnType = TxnType.BURN;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
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
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
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

    let marginPercentage: number;

    if (this.fixedFeeAtom === undefined) {
      this.fixedFeeAtom = this.getFixedFeeAtom();
    }

    if (this.txnType === TxnType.MINT) {
      marginPercentage = ENV.MINT_PERCENT_FEE;
    } else if (this.txnType === TxnType.BURN) {
      marginPercentage = ENV.BURN_PERCENT_FEE;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
        txnType: this.txnType,
      });
    }

    const marginFee: bigint =
      // TODO: fix marginPercentage cannot be 0.2% (rounding)
      ((this.fromAmountAtom - this.fixedFeeAtom) * BigInt(marginPercentage)) /
        BigInt(100) +
      BigInt(1); // +1 for rounding up

    this.marginFeeAtom = marginFee;
    return marginFee;
  }

  calculateToAmountAtom(): bigint {
    if (this.toAmountAtom !== undefined) {
      return this.toAmountAtom;
    }

    if (this.fixedFeeAtom === undefined) {
      this.fixedFeeAtom = this.getFixedFeeAtom();
    }
    if (this.marginFeeAtom === undefined) {
      this.marginFeeAtom = this.calculateMarginFeeAtom();
    }

    const toAmount: bigint =
      this.fromAmountAtom - this.fixedFeeAtom - this.marginFeeAtom;

    this.toAmountAtom = toAmount;
    return toAmount;
  }
}
