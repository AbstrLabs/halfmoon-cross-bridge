export { type BridgeTxnObject, type CriticalBridgeTxnObject, BridgeTxn };

import { ApiCallParam, DbId, DbItem, TxnId, parseDbItem } from '../utils/type';
import { Blockchain, ConfirmOutcome, TxnType } from '../blockchain';
import { BlockchainName, BridgeTxnStatus } from '..';
import { BridgeError, ERRORS } from '../utils/errors';

import { ENV } from '../utils/dotenv';
import { algoBlockchain } from '../blockchain/algorand';
import { db } from '../database/db';
import { toGoNearAtom } from '../utils/formatter';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';
import { nearBlockchain } from '../blockchain/near';

interface InitializeOptions {
  notCreateInDb?: boolean;
}

interface CriticalBridgeTxnObject {
  dbId?: number;
  fixedFeeAtom?: bigint;
  marginFeeAtom?: bigint;
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
}
interface BridgeTxnObject extends CriticalBridgeTxnObject {
  dbId?: number;
  fixedFeeAtom: bigint;
  marginFeeAtom: bigint;
  createdTime: bigint;
  fromAddr: string;
  fromAmountAtom: bigint;
  fromBlockchain: BlockchainName;
  fromTxnId: string;
  toAddr: string;
  toAmountAtom: bigint;
  toBlockchain: BlockchainName;
  toTxnId?: string;
  txnStatus: BridgeTxnStatus;
}

class BridgeTxn implements CriticalBridgeTxnObject {
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
  #db = db;
  #fromBlockchain!: Blockchain;
  #toBlockchain!: Blockchain;
  /* private # */ _isInitializedPromise: Promise<boolean>;

  /* CONSTRUCTORS  */

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
      fromAmountAtom: toGoNearAtom(amount),
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
  static fromDbItem(dbItem: DbItem, dbName: TxnType): BridgeTxn {
    const _dbItem = parseDbItem(dbItem);
    const bridgeTxn: BridgeTxn = new BridgeTxn({
      dbId: _dbItem.db_id,
      txnType: dbName,

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

  // async runWholeBridgeTxn(): Promise<BridgeTxn> {
  async runWholeBridgeTxn(): Promise<BridgeTxnObject> {
    logger.info(
      literals.MAKING_TXN(
        `${this.fromBlockchain}->${this.toBlockchain}`,
        this.fromAmountAtom,
        this.fromAddr,
        this.toAddr
      )
    );
    const isInitialized = await this._isInitializedPromise;
    if (!isInitialized) {
      throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR, {
        bridgeTxn: this,
      });
    }

    await this.confirmIncomingTxn();
    await this.makeOutgoingTxn();
    await this.verifyOutgoingTxn();
    return this.toObject();
    // return this;
  }

  async confirmIncomingTxn(): Promise<void> {
    await this._isInitializedPromise;
    if (!this._isInitializedPromise) {
      throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR, {
        at: 'BridgeTxn.confirmIncomingTxn',
        bridgeTxn: this,
      });
    }
    this._checkStatus(BridgeTxnStatus.DONE_INITIALIZE, 'confirmIncomingTxn');

    await this._updateTxnStatus(BridgeTxnStatus.DOING_INCOMING);

    let confirmOutcome;
    try {
      confirmOutcome = await this.#fromBlockchain.confirmTxn({
        fromAddr: this.fromAddr,
        atomAmount: this.fromAmountAtom,
        toAddr: this.#fromBlockchain.centralizedAddr,
        txnId: this.fromTxnId,
      });
    } finally {
      switch (confirmOutcome) {
        case ConfirmOutcome.SUCCESS:
          break;
        case ConfirmOutcome.WRONG_INFO:
          await this._updateTxnStatus(BridgeTxnStatus.ERR_VERIFY_INCOMING);
          break;
        case ConfirmOutcome.TIMEOUT:
          await this._updateTxnStatus(BridgeTxnStatus.ERR_TIMEOUT_INCOMING);
          break;
      }
    }

    if (this.txnType === undefined) {
      // for TS
      this.txnType = this._inferTxnType();
    }
    await this._updateTxnStatus(BridgeTxnStatus.DONE_INCOMING);
  }

  async makeOutgoingTxn(): Promise<void> {
    this._checkStatus(BridgeTxnStatus.DONE_INCOMING, 'makeOutgoingTxn');

    let outgoingTxnId: TxnId;
    this.toAmountAtom = this.getToAmountAtom();
    try {
      await this._updateTxnStatus(BridgeTxnStatus.DOING_OUTGOING);
      outgoingTxnId = await this.#toBlockchain.makeOutgoingTxn({
        fromAddr: this.#toBlockchain.centralizedAddr,
        toAddr: this.toAddr,
        atomAmount: this.toAmountAtom,
        txnId: literals.UNUSED,
      });
      if (outgoingTxnId === undefined) {
        throw new BridgeError(ERRORS.EXTERNAL.EMPTY_NEW_TXN_ID, {
          at: 'BridgeTxn.makeOutgoingTxn',
        });
      }
      await this._updateToTxnId(outgoingTxnId);
    } catch (err) {
      await this._updateTxnStatus(BridgeTxnStatus.ERR_MAKE_OUTGOING);
      throw new BridgeError(ERRORS.EXTERNAL.MAKE_OUTGOING_TXN_FAILED, {
        bridgeTxn: this,
        err,
      });
    }
  }

  async verifyOutgoingTxn(): Promise<void> {
    this._checkStatus(BridgeTxnStatus.DOING_OUTGOING, 'verifyOutgoingTxn');
    try {
      await this.#toBlockchain.confirmTxn({
        fromAddr: this.#toBlockchain.centralizedAddr,
        toAddr: this.toAddr,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        atomAmount: this.toAmountAtom!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        txnId: this.toTxnId!,
      });
    } catch (e) {
      await this._updateTxnStatus(BridgeTxnStatus.ERR_CONFIRM_OUTGOING);
      throw new BridgeError(ERRORS.EXTERNAL.CONFIRM_OUTGOING_TXN_FAILED, {
        bridgeTxn: this,
        err: e,
      });
    }
    await this._updateTxnStatus(BridgeTxnStatus.DONE_OUTGOING);
  }

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

  public toObject(): BridgeTxnObject {
    this._initialize({ notCreateInDb: true }); // this makes all fields non-null
    const bridgeTxnObject: BridgeTxnObject = {
      dbId: this.dbId,
      fixedFeeAtom: this.fixedFeeAtom!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
      marginFeeAtom: this.marginFeeAtom!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
      createdTime: this.createdTime,
      fromAddr: this.fromAddr,
      fromAmountAtom: this.fromAmountAtom,
      fromBlockchain: this.fromBlockchain!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
      fromTxnId: this.fromTxnId,
      toAddr: this.toAddr,
      toAmountAtom: this.toAmountAtom!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
      toBlockchain: this.toBlockchain!, // eslint-disable-line @typescript-eslint/no-non-null-assertion
      toTxnId: this.toTxnId,
      txnStatus: this.txnStatus,
    };
    return Object.assign(bridgeTxnObject, this);
  }

  public toString(): string {
    return JSON.stringify(this.toObject());
  }

  /* GETTERS */

  public getToAmountAtom(): bigint {
    if (this.toAmountAtom === undefined) {
      this.toAmountAtom = this._calculateToAmountAtom();
    }
    return this.toAmountAtom;
  }

  /**
   * @returns TxnType
   */
  public getTxnType(): TxnType {
    return this.txnType ?? this._inferTxnType();
  }

  public getDbId(): number {
    // TODO: this is not used in production. But it's incorrect because it
    // ++ should always throw error. However, we can have a #isInitialized
    // ++ and make it true when _isInitializedPromise is settled. In this
    // ++ way it should work

    let isInitialized = false;
    this._isInitializedPromise.then(() => {
      isInitialized = true;
      if (this.dbId === undefined) {
        throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR, {
          at: 'BridgeTxn.getDbId',
        });
      }
    });
    if (isInitialized) {
      // the parte before ensures non-null
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.dbId!;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_NOT_INITIALIZED, {
        extraMsg: 'try to get dbId before BridgeTxn is initialized',
        at: 'BridgeTxn.getDbId',
      });
    }
  }

  /* PRIVATE METHODS - CLASS INIT */

  /**
   * Initiate the BridgeTxn.
   * Most fields are readonly, and are defined after initiate().
   * 3 Exceptions: `dbId`, `toTxnId` are allowed to be assigned once.
   * Field `txnStatus` is allowed to be assigned by the ${@link enum BridgeTxnStatus}.
   *
   * @returns Promise<BridgeTxn>
   *
   * @todo link the enum BridgeTxnStatus from ${REPO_ROOT}/index.ts
   */
  private async _initialize(
    initializeOptions: InitializeOptions
  ): Promise<this> {
    try {
      this._verifyValidity();
      this._inferTxnType();
      this._inferBlockchainNames();
      this._hookBlockchain();
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

    // TODO: verify to address is legal with indexer.

    // TODO: (later) we can also do a min/max of amount check here.
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
  private _hookBlockchain(): void {
    if (this.fromBlockchain === undefined || this.toBlockchain === undefined) {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_BLOCKCHAIN_NAME, {
        fromBlockchain: this.fromBlockchain,
        toBlockchain: this.toBlockchain,
        at: 'BridgeTxn._hookBlockchain',
      });
    }
    this._hookFromBlockchain();
    this._hookToBlockchain();
  }
  private _hookFromBlockchain(): void {
    if (this.fromBlockchain === BlockchainName.NEAR) {
      this.#fromBlockchain = nearBlockchain;
    } else if (this.fromBlockchain === BlockchainName.ALGO) {
      this.#fromBlockchain = algoBlockchain;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_BLOCKCHAIN_NAME, {
        fromBlockchain: this.fromBlockchain,
        at: 'BridgeTxn._hookBlockchain',
      });
    }
  }
  private _hookToBlockchain(): void {
    if (this.toBlockchain === BlockchainName.NEAR) {
      this.#toBlockchain = nearBlockchain;
    } else if (this.toBlockchain === BlockchainName.ALGO) {
      this.#toBlockchain = algoBlockchain;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_BLOCKCHAIN_NAME, {
        toBlockchain: this.toBlockchain,
        at: 'BridgeTxn._hookBlockchain',
      });
    }
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
      fixedFee = toGoNearAtom(ENV.BURN_FIX_FEE);
    } else if (this.txnType === TxnType.BURN) {
      fixedFee = toGoNearAtom(ENV.MINT_FIX_FEE);
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

    if (this.txnType === TxnType.MINT) {
      marginPercentage = ENV.MINT_MARGIN_FEE_BIPS;
    } else if (this.txnType === TxnType.BURN) {
      marginPercentage = ENV.BURN_MARGIN_FEE_BIPS;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
        txnType: this.txnType,
      });
    }

    const marginFee: bigint = // suppose no bigint overflow
      (this.fromAmountAtom * BigInt(marginPercentage)) / BigInt(10000) +
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
    if (!this.#db.isConnected) {
      throw new BridgeError(ERRORS.INTERNAL.DB_NOT_CONNECTED, {
        at: 'BridgeTxn._createInDb',
        db: this.#db,
      });
    }

    // make sure fromTxnId is not reused
    // possible improvement: make sure transaction is finished recently, check a wider range in db
    const dbEntryWithTxnId = await this.#db.readTxnFromTxnId(
      this.fromTxnId,
      this.getTxnType()
    );
    if (dbEntryWithTxnId.length > 0) {
      await this._updateTxnStatus(BridgeTxnStatus.ERR_VERIFY_INCOMING);
      throw new BridgeError(ERRORS.API.REUSED_INCOMING_TXN, {
        at: 'BridgeTxn.confirmIncomingTxn',
        bridgeTxn: this,
        txnId: this.fromTxnId,
      });
    }

    try {
      this.dbId = await this.#db.createTxn(this);
    } catch (err) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_CREATE_TXN_FAILED, {
        at: 'BridgeTxn._createDbEntry',
        error: err,
        bridgeTxn: this,
      });
    }
    if (!this.#db.isConnected) {
      throw new BridgeError(ERRORS.INTERNAL.DB_NOT_CONNECTED, {
        at: 'BridgeTxn._updateTxnStatus',
      });
    }
    return this.dbId;
  }

  private async _updateTxn(): Promise<DbId> {
    if (this.txnStatus === undefined) {
      throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR, {
        at: 'BridgeTxn._updateTxnStatus',
      });
    }
    if (!this.#db.isConnected) {
      throw new BridgeError(ERRORS.INTERNAL.DB_NOT_CONNECTED, {
        at: 'BridgeTxn._updateTxnStatus',
      });
    }
    return await this.#db.updateTxn(this);
  }
  private async _updateTxnStatus(status: BridgeTxnStatus): Promise<DbId> {
    // will raise err if current txnStatus is error.
    if (
      [
        BridgeTxnStatus.ERR_AWS_RDS_DB,
        BridgeTxnStatus.ERR_CONFIRM_OUTGOING,
        BridgeTxnStatus.ERR_INITIALIZE,
        BridgeTxnStatus.ERR_MAKE_OUTGOING,
        BridgeTxnStatus.ERR_SEVER_INTERNAL,
        BridgeTxnStatus.ERR_TIMEOUT_INCOMING,
        BridgeTxnStatus.ERR_CONFIRM_OUTGOING,
      ].includes(this.txnStatus)
    ) {
      throw new BridgeError(ERRORS.INTERNAL.OVERWRITE_ERROR_TXN_STATUS, {
        bridgeTxn: this,
      });
    }
    this.txnStatus = status;
    return await this._updateTxn();
  }
  private async _updateToTxnId(toTxnId: TxnId): Promise<DbId> {
    this.toTxnId = toTxnId;
    return await this._updateTxn();
  }

  /* PRIVATE METHODS - HELPERS */

  private _checkStatus(expected: BridgeTxnStatus, at: string): void {
    if (!(this.txnStatus === expected)) {
      throw new BridgeError(ERRORS.INTERNAL.ILLEGAL_TXN_STATUS, {
        at: `BridgeTxn.${at}`,
        bridgeTxn: this,
      });
    }
  }
}
