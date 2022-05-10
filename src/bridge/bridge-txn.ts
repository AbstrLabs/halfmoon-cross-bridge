// TODO: add a toString() method to BridgeTxn

export { BridgeTxn };

import { ApiCallParam, DbId, DbItem, parseDbItem } from '../utils/type';
import { BlockchainName, BridgeTxnStatus } from '..';
import { BridgeError, ERRORS } from '../utils/errors';

import { ENV } from '../utils/dotenv';
import { TxnType } from '../blockchain';
import { db } from '../database/db';
import { goNearToAtom } from '../utils/formatter';

interface InitializeOptions {
  notCreateInDb?: boolean;
}

class BridgeTxn {
  dbId?: number;
  fixedFeeAtom?: bigint;
  marginFeeAtom?: bigint;
  createdTime: bigint;
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
  private _db = db;
  /* private  */ _isInitializedPromise: Promise<boolean>;

  static fromApiCallParam(
    apiCallParam: ApiCallParam,
    txnType: TxnType,
    createdTime?: bigint
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
      createdTime,
      toAddr: to,
      toAmountAtom: undefined,
      toBlockchain: undefined,
      toTxnId: undefined,
      txnStatus: BridgeTxnStatus.DOING_INITIALIZE,
    });
    return bridgeTxn;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDbItem(dbItem: DbItem, dbType: TxnType): BridgeTxn {
    const _dbItem = parseDbItem(dbItem);
    const bridgeTxn: BridgeTxn = new BridgeTxn({
      dbId: _dbItem.db_id,
      txnType: dbType,

      fixedFeeAtom: BigInt(_dbItem.fixed_fee_atom),
      fromAddr: _dbItem.from_addr,
      fromAmountAtom: BigInt(_dbItem.from_amount_atom),
      fromBlockchain: undefined,
      fromTxnId: _dbItem.from_txn_id,
      marginFeeAtom: BigInt(_dbItem.margin_fee_atom),
      createdTime: BigInt(_dbItem.created_time),
      toAddr: _dbItem.to_addr,
      toAmountAtom: BigInt(_dbItem.to_amount_atom),
      toBlockchain: undefined,
      toTxnId: _dbItem.to_txn_id,
      txnStatus: _dbItem.txn_status,
    });
    return bridgeTxn;
  }

  constructor(
    {
      fixedFeeAtom,
      marginFeeAtom,
      createdTime,
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
      createdTime?: bigint;

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
    },
    initializeOptions: InitializeOptions = {
      notCreateInDb: false,
    }
  ) {
    this.fixedFeeAtom = fixedFeeAtom;
    this.marginFeeAtom = marginFeeAtom;
    this.createdTime = createdTime ?? BigInt(+Date.now());
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

    // TODO: maybe a `static async asyncConstruct(){}` is better?
    this._isInitializedPromise = new Promise((resolve) => {
      this._initialize(initializeOptions).then(() => {
        resolve(true);
      });
    });
  }

  /* MAKE BRIDGE TRANSACTION */
  // process according to sequence diagram

  /* MISCELLANEOUS */

  /**
   * @param  {BridgeTxn} other
   * @returns {boolean} true if the two BridgeTxn are considered same
   *
   * @todo: Bigint with jest https://github.com/facebook/jest/issues/11617#issuecomment-1068732414
   */
  public equals(other: BridgeTxn): boolean {
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
      this.createdTime.toString() === other.createdTime.toString()
    );
  }

  /* GETTERS */

  public getToAmountAtom(): bigint {
    if (this.toAmountAtom === undefined) {
      this.toAmountAtom = this._calculateToAmountAtom();
    }
    return this.toAmountAtom;
  }
  public getTxnType(): TxnType {
    return this.txnType ?? this._inferTxnType();
  }

  /* PRIVATE METHODS - CLASS INIT */

  /**
   * Initiate the BridgeTxn.
   * Most fields are readonly, and are defined after initiate().
   * 3 Exceptions: `dbId`, `toTxnId` are allowed to be assigned once.
   * Field `txnStatus` is allowed to be assigned by the ${@link enum BridgeTxnStatus}.
   *
   * @returns ???
   *
   * TODO: link the enum BridgeTxnStatus from ${REPO_ROOT}/index.ts
   */
  private async _initialize(
    initializeOptions: InitializeOptions
  ): Promise<this> {
    try {
      this._verifyValidity();
      this._inferTxnType();
      this._inferBlockchainNames();
      this._getFixedFeeAtom();
      this._calculateMarginFeeAtom();
      this._calculateToAmountAtom();
    } catch (err) {
      this.txnStatus = BridgeTxnStatus.ERR_INITIALIZE;
      if (initializeOptions.notCreateInDb === false) {
        await this._createInDb();
      }
      throw err;
    }

    this.txnStatus = BridgeTxnStatus.DONE_INITIALIZE;
    if (initializeOptions.notCreateInDb === false) {
      await this._createInDb();
    }
    return this;
  }

  private _verifyValidity(): this {
    if (
      (this.fromBlockchain === undefined || this.toBlockchain === undefined) &&
      this.txnType === undefined
    ) {
      throw new BridgeError(ERRORS.INTERNAL.INVALID_BRIDGE_TXN_PARAM);
    }

    if (this.fixedFeeAtom === undefined) {
      this.fixedFeeAtom = this._getFixedFeeAtom();
    }

    if (this.fromAmountAtom < this.fixedFeeAtom) {
      throw new BridgeError(ERRORS.INTERNAL.INVALID_AMOUNT, {
        fromAmountAtom: this.fromAmountAtom,
      });
    }

    //TODO: verify to address is legal.

    // we can also do a min/max check here.
    return this;
  }

  private _inferBlockchainNames(): {
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

  private _inferTxnType(): TxnType {
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

  private _getFixedFeeAtom(): bigint {
    if (this.fixedFeeAtom !== undefined) {
      return this.fixedFeeAtom;
    }
    let fixedFee: bigint;
    if (this.txnType === undefined) {
      this._inferTxnType();
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

  private _calculateMarginFeeAtom(): bigint {
    if (this.marginFeeAtom !== undefined) {
      return this.marginFeeAtom;
    }

    let marginPercentage: number;

    if (this.fixedFeeAtom === undefined) {
      this.fixedFeeAtom = this._getFixedFeeAtom();
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

  private _calculateToAmountAtom(): bigint {
    if (this.toAmountAtom !== undefined) {
      return this.toAmountAtom;
    }

    if (this.fixedFeeAtom === undefined) {
      this.fixedFeeAtom = this._getFixedFeeAtom();
    }
    if (this.marginFeeAtom === undefined) {
      this.marginFeeAtom = this._calculateMarginFeeAtom();
    }

    const toAmount: bigint =
      this.fromAmountAtom - this.fixedFeeAtom - this.marginFeeAtom;

    this.toAmountAtom = toAmount;
    return toAmount;
  }

  /* PRIVATE METHODS - DATABASE */

  private async _createInDb(): Promise<DbId> {
    if (!this._db.isConnected) {
      throw new BridgeError(ERRORS.INTERNAL.DB_NOT_CONNECTED, {
        at: 'BridgeTxn._createInDb',
        db: this._db,
      });
    }
    try {
      this.dbId = await this._db.createTxn(this);
    } catch (e) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_CREATE_TXN_FAILED, {
        at: 'BridgeTxn._createDbEntry',
        error: e,
        bridgeTxn: this,
      });
    }
    if (!this._db.isConnected) {
      throw new BridgeError(ERRORS.INTERNAL.DB_NOT_CONNECTED, {
        at: 'BridgeTxn._updateTxnStatus',
      });
    }
    return this.dbId;
  }

  private async _updateTxnStatus(): Promise<DbId> {
    if (this.txnStatus === undefined) {
      throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR, {
        at: 'BridgeTxn._updateTxnStatus',
      });
    }
    if (!this._db.isConnected) {
      throw new BridgeError(ERRORS.INTERNAL.DB_NOT_CONNECTED, {
        at: 'BridgeTxn._updateTxnStatus',
      });
    }
    return await this._db.updateTxn(this);
  }
}
