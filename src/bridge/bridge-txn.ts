/**
 * @todo docs: alternative constructors not marked
 */
export { type BridgeTxnObj, type BridgeTxnSafeObj, BridgeTxn };

import type { Override } from '../utils/type/type-operator';

import { Blockchain, ConfirmOutcome } from '../blockchain/abstract-base';
import { BridgeTxnActionName } from '..';
import { BridgeError, ERRORS } from '../utils/bridge-error';

import { db } from '../database/db';
import { stringifyBigintInObj } from '../utils/formatter';
import { literals } from '../utils/bridge-const';
import { getTokenImplBlockchain } from './token-table';
import { getBridgeInfo } from './bridge-info';
import { TokenId } from '../common/src/type/token';
import { BridgeTxnSafeObj, BridgeTxnStatusEnum } from '../common/src/type/txn';
import { bigintBips, optionalBigInt } from '../utils/helper';
import { log } from '../utils/log/log-template';
import { DbId, DbItem, parseDbItem } from '../common/src/type/database';
import { TxnId } from '../common/src/type/blockchain';
import { ApiCallParam } from '../common/src/type/api';
import { parseTxnUid } from '../common/src/type/cross-module';

interface BridgeTxnObjBase {
  dbId?: number;
  fixedFeeAtom?: bigint;
  marginFeeAtom?: bigint;
  fromAddr: string;
  fromAmountAtom: bigint;
  fromTokenId: TokenId;
  fromTxnId: string;
  toAddr: string;
  toAmountAtom?: bigint;
  toTokenId: TokenId;
  txnStatus?: BridgeTxnStatusEnum;
  toTxnId?: string | null;
  createdTime?: bigint;
}

interface BridgeTxnObj extends BridgeTxnObjBase {
  fixedFeeAtom: bigint;
  marginFeeAtom: bigint;
  createdTime: bigint;
  toAmountAtom: bigint;
  txnStatus: BridgeTxnStatusEnum;
}

type BridgeTxnActionFn = () => Promise<void>;
type BridgeTxnAction = {
  [methodName in BridgeTxnActionName]: BridgeTxnActionFn;
};

/* DECORATOR */

/**
 * Helper to throw an error if the {@link txnStatus} is not equal to the expected status.
 *
 * @decorator this is a decorator factory
 * @throws {@link ERRORS.INTERNAL.ILLEGAL_TXN_STATUS} if the txnStatus is not equal to the expected status
 */
function requireStatus(txnStatus: BridgeTxnStatusEnum) {
  return function (
    target: BridgeTxn,
    key: `${BridgeTxnActionName}`,
    descriptor: TypedPropertyDescriptor<BridgeTxnActionFn>
  ) {
    const originalMethod = descriptor.value;
    if (originalMethod === undefined) {
      throw new BridgeError(ERRORS.INTERNAL.TS_ENGINE_ERROR);
    }
    descriptor.value = function (this: BridgeTxn) {
      if (this.txnStatus !== txnStatus) {
        throw new BridgeError(
          ERRORS.INTERNAL.ILLEGAL_TXN_STATUS, //BRIDGE_TXN_STATUS_MISMATCH,
          {
            at: `BridgeTxn.${key}`,
            bridgeTxn: this,
            expected: txnStatus,
            actual: this.txnStatus,
          }
        );
      }
      return originalMethod.apply(this);
    };
    return descriptor;
  };
}

function requireCreatedInDb(
  target: BridgeTxn,
  key: `${BridgeTxnActionName}`,
  descriptor: TypedPropertyDescriptor<BridgeTxnActionFn>
) {
  interface _PrivateBridgeTxn {
    // for TS Engine
    _isCreatedInDb: boolean;
  }
  const originalMethod = descriptor.value;
  if (originalMethod === undefined) {
    throw new BridgeError(ERRORS.INTERNAL.TS_ENGINE_ERROR);
  }
  descriptor.value = function (this: Override<BridgeTxn, _PrivateBridgeTxn>) {
    if (!this._isCreatedInDb) {
      throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR, {
        at: `BridgeTxn.${key}`,
        bridgeTxn: this,
        reason:
          'BridgeTxn should be created in DB before confirming incoming txn',
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return originalMethod.apply(this);
  };
  return descriptor;
}

/**
 * BridgeTxn is a transaction that is used to transfer tokens between two different blockchains.
 *
 * @param bridgeTxnObject - Transaction JSON,
 * @param initializeOptions -
 */
class BridgeTxn implements BridgeTxnObjBase, BridgeTxnAction {
  dbId?: number;
  fixedFeeAtom: bigint;
  marginFeeAtom: bigint;
  createdTime: bigint;
  fromAddr: string;
  fromAmountAtom: bigint;
  fromTokenId: TokenId;
  fromTxnId: string;
  toAddr: string;
  toAmountAtom: bigint;
  toTokenId: TokenId;
  txnStatus: BridgeTxnStatusEnum;
  toTxnId?: string | null;
  txnComment: string | null = null;
  private _isCreatedInDb: boolean;
  #db = db;

  /* CONSTRUCTORS  */

  /**
   * Initialize a {@link BridgeTxn} from the given {@link ApiCallParam}. Will use system time as default.
   *
   * @param apiCallParam - The API call parameter to initialize the {@link BridgeTxn} from.
   * @param createdTime - optional, if not provided, will use system time
   * @returns the {@link BridgeTxn} constructed
   */
  static fromApiCallParam(
    apiCallParam: ApiCallParam,
    createdTime?: bigint
  ): BridgeTxn {
    const { from_addr, from_token, to_addr, to_token, amount, txn_id } =
      apiCallParam;
    const bridgeTxn = new BridgeTxn({
      dbId: undefined,
      fixedFeeAtom: undefined,
      fromAddr: from_addr,
      fromAmountAtom: getBridgeInfo(from_token, to_token).amountParser(amount),
      fromTokenId: from_token,
      fromTxnId: txn_id,
      marginFeeAtom: undefined,
      createdTime,
      toAddr: to_addr,
      toAmountAtom: undefined,
      toTokenId: to_token,
      toTxnId: undefined,
      txnStatus: undefined,
    });
    return bridgeTxn;
  }

  /**
   * Initialize a {@link BridgeTxn} from the given {@link DbItem}.
   *
   * @param dbItem - The {@link DbItem} to initialize the {@link BridgeTxn} from.
   * @returns The {@link BridgeTxn} constructed
   */
  static fromDbItem(dbItem: DbItem): BridgeTxn {
    const _dbItem = parseDbItem(dbItem);
    const bridgeTxn: BridgeTxn = new BridgeTxn({
      dbId: _dbItem.db_id,
      fixedFeeAtom: BigInt(_dbItem.fixed_fee_atom),
      fromAddr: _dbItem.from_addr,
      fromAmountAtom: BigInt(_dbItem.from_amount_atom),
      fromTokenId: _dbItem.from_token_id,
      fromTxnId: _dbItem.from_txn_id,
      marginFeeAtom: BigInt(_dbItem.margin_fee_atom),
      createdTime: BigInt(_dbItem.created_time),
      toAddr: _dbItem.to_addr,
      toAmountAtom: BigInt(_dbItem.to_amount_atom),
      toTokenId: _dbItem.to_token_id,
      toTxnId: _dbItem.to_txn_id,
      txnStatus: _dbItem.txn_status,
    });
    bridgeTxn._isCreatedInDb = true;
    return bridgeTxn;
  }

  static fromObject(safeObj: BridgeTxnSafeObj) {
    const bridgeTxn: BridgeTxn = new BridgeTxn({
      dbId:
        typeof safeObj.dbId === 'number'
          ? safeObj.dbId
          : parseInt(safeObj.dbId),
      fixedFeeAtom: optionalBigInt(safeObj.fixedFeeAtom),
      fromAddr: safeObj.fromAddr,
      fromAmountAtom: BigInt(safeObj.fromAmountAtom),
      fromTokenId: safeObj.fromTokenId,
      fromTxnId: safeObj.fromTxnId,
      marginFeeAtom: optionalBigInt(safeObj.marginFeeAtom),
      createdTime: optionalBigInt(safeObj.createdTime),
      toAddr: safeObj.toAddr,
      toAmountAtom: optionalBigInt(safeObj.toAmountAtom),
      toTokenId: safeObj.toTokenId,
      toTxnId: safeObj.toTxnId,
      txnStatus: safeObj.txnStatus,
    });
    return bridgeTxn;
  }

  constructor({
    fixedFeeAtom,
    marginFeeAtom,
    createdTime,
    fromAddr,
    fromAmountAtom,
    fromTokenId,
    fromTxnId,
    toAddr,
    toAmountAtom,
    toTokenId,
    txnStatus,
    toTxnId,
    dbId,
  }: BridgeTxnObjBase) {
    this._isCreatedInDb = false;

    this.fromTokenId = fromTokenId;
    this.toTokenId = toTokenId;

    this.fromTxnId = fromTxnId;
    this.fromAmountAtom = fromAmountAtom;
    this.fromAddr = fromAddr;
    this.fromAmountAtom = fromAmountAtom;
    this.toAddr = toAddr;
    this.toTxnId = toTxnId;
    this.dbId = dbId;

    try {
      // TODO: (ANB-114) v0.3, Below will be overwritten if instantiated with value.
      this.fixedFeeAtom = fixedFeeAtom ?? this._readFixedFeeAtom();
      this.marginFeeAtom = marginFeeAtom ?? this._calculateMarginFeeAtom();
      this.createdTime = createdTime ?? BigInt(+Date.now());
      this.toAmountAtom = toAmountAtom ?? this._calculateToAmountAtom();
      // next line seems not needed, consider removing it.
      this.txnStatus = txnStatus ?? BridgeTxnStatusEnum.DOING_INITIALIZE;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      this.txnStatus = BridgeTxnStatusEnum.ERR_INITIALIZE;
      throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR, {
        at: 'BridgeTxn._initialize',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
        err: err.toString(),
      });
    }
    this._selfValidate();
    this.txnStatus = txnStatus ?? BridgeTxnStatusEnum.DONE_INITIALIZE;
  }

  /* MAKE BRIDGE TRANSACTION */
  // process according to sequence diagram

  /**
   * Confirm the incoming transaction of the {@link BridgeTxn}.
   * Change the txnStatus from {@link BridgeTxnStatusEnum.DONE_INITIALIZE} to {@link BridgeTxnStatusEnum.DONE_CONFIRM_INCOMING_TXN} or the corresponding errors.
   *
   * @decorator `@requireCreatedInDb`
   * @decorator `@requireStatus(BridgeTxnStatusEnum.DONE_INITIALIZE)`
   * @throws {@link ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR} if the {@link BridgeTxn} is not initialized
   * @returns Promise of void
   */
  @requireCreatedInDb
  @requireStatus(BridgeTxnStatusEnum.DONE_INITIALIZE)
  async confirmIncomingTxn(): Promise<void> {
    log.BTXN.onConfirmIncome();
    await this._updateTxnStatus(BridgeTxnStatusEnum.DOING_INCOMING);

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
          await this._updateTxnStatus(BridgeTxnStatusEnum.ERR_VERIFY_INCOMING);
          break;
        case ConfirmOutcome.TIMEOUT:
          await this._updateTxnStatus(BridgeTxnStatusEnum.ERR_TIMEOUT_INCOMING);
          break;
      }
    }

    await this._updateTxnStatus(BridgeTxnStatusEnum.DONE_INCOMING);
  }

  /**
   * Make the outgoing transaction of the {@link BridgeTxn}.
   * Change the txnStatus from {@link BridgeTxnStatusEnum.CONFIRM_INCOMING_TXN} to {@link BridgeTxnStatusEnum.DOING_OUTGOING} or the corresponding errors.
   *
   * @decorator `@requireCreatedInDb`
   * @decorator `@requireStatus(BridgeTxnStatusEnum.DONE_INCOMING)`
   * @throws {@link ERRORS.EXTERNAL.EMPTY_NEW_TXN_ID} if the {@link BridgeTxn#toTxnId} is empty.
   * @throws {@link ERRORS.EXTERNAL.MAKE_OUTGOING_TXN_FAILED} if the {@link BridgeTxn#toBlockchainName} fails to make the outgoing transaction.
   * @returns Promise of void
   */
  @requireCreatedInDb
  @requireStatus(BridgeTxnStatusEnum.DONE_INCOMING)
  async makeOutgoingTxn(): Promise<void> {
    let outgoingTxnId: TxnId;
    try {
      outgoingTxnId = await this.#toBlockchain.makeOutgoingTxn({
        fromAddr: this.#toBlockchain.centralizedAddr,
        toAddr: this.toAddr,
        atomAmount: this.toAmountAtom,
        txnId: literals.UNUSED_STR,
      });
      // if (outgoingTxnId === undefined) {
      //   throw new BridgeError(ERRORS.EXTERNAL.EMPTY_NEW_TXN_ID, {
      //     at: 'BridgeTxn.makeOutgoingTxn',
      //   });
      // }
    } catch (err) {
      await this._updateTxnStatus(BridgeTxnStatusEnum.ERR_MAKE_OUTGOING);
      throw new BridgeError(ERRORS.EXTERNAL.MAKE_OUTGOING_TXN_FAILED, {
        bridgeTxn: this,
        detail: 'bridge txn make outgoing txn failed',
        err,
      });
    }
    // FIX: using DOING_OUTGOING as DONE_OUTGOING now
    await this._updateTxnStatus(BridgeTxnStatusEnum.DOING_OUTGOING);
    await this._updateToTxnId(outgoingTxnId);
  }

  /**
   * Verify the outgoing transaction of the {@link BridgeTxn}.
   * Change the txnStatus from {@link BridgeTxnStatusEnum.DOING_OUTGOING} to {@link BridgeTxnStatusEnum.DONE_OUTGOING} or the corresponding errors.
   *
   * @decorator `@requireCreatedInDb`
   * @decorator `@requireStatus(BridgeTxnStatusEnum.DONE_OUTGOING)`
   * @throws {@link ERRORS.EXTERNAL.CONFIRM_OUTGOING_TXN_FAILED} if the verification fails
   * @returns Promise of void
   */
  @requireCreatedInDb
  @requireStatus(BridgeTxnStatusEnum.DOING_OUTGOING)
  async verifyOutgoingTxn(): Promise<void> {
    try {
      await this.#toBlockchain.confirmTxn({
        fromAddr: this.#toBlockchain.centralizedAddr,
        toAddr: this.toAddr,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        atomAmount: this.toAmountAtom,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        txnId: this.toTxnId!,
      });
    } catch (e) {
      await this._updateTxnStatus(BridgeTxnStatusEnum.ERR_CONFIRM_OUTGOING);
      throw new BridgeError(ERRORS.EXTERNAL.CONFIRM_OUTGOING_TXN_FAILED, {
        bridgeTxn: this,
        err: e,
      });
    }
    await this._updateTxnStatus(BridgeTxnStatusEnum.DONE_OUTGOING);
  }

  /* MISCELLANEOUS */

  /**
   * Determine if two instances of {@link BridgeTxn} are equal.
   *
   * @param other - The other instance of {@link BridgeTxn} to compare with
   * @returns Boolean if the two BridgeTxn are considered same
   *
   * @update Bigint with jest https://github.com/facebook/jest/issues/11617#issuecomment-1068732414
   */
  public equals(other: BridgeTxn): boolean {
    return (
      this.fromAddr === other.fromAddr &&
      this.fromAmountAtom.toString() === other.fromAmountAtom.toString() &&
      this.fromTokenId === other.fromTokenId &&
      this.fromTxnId === other.fromTxnId &&
      this.toAddr === other.toAddr &&
      this.toAmountAtom.toString() === other.toAmountAtom.toString() &&
      this.toTokenId === other.toTokenId &&
      this.toTxnId === other.toTxnId &&
      this.txnStatus === other.txnStatus &&
      this.dbId === other.dbId &&
      this.fixedFeeAtom.toString() === other.fixedFeeAtom.toString() &&
      this.marginFeeAtom.toString() === other.marginFeeAtom.toString() &&
      this.createdTime.toString() === other.createdTime.toString()
    );
  }

  public toSafeObject(): BridgeTxnSafeObj {
    return stringifyBigintInObj(this.toObject()) as BridgeTxnSafeObj;
  }

  /**
   * Transform the {@link BridgeTxn} to an object with all info, wrapping up all important fields.
   *
   * @returns The object representation of the {@link BridgeTxn}
   */
  public toObject(): BridgeTxnObj {
    const bridgeTxnObject: BridgeTxnObj = {
      dbId: this.dbId,
      fixedFeeAtom: this.fixedFeeAtom,
      marginFeeAtom: this.marginFeeAtom,
      createdTime: this.createdTime,
      fromAddr: this.fromAddr,
      fromAmountAtom: this.fromAmountAtom,
      fromTokenId: this.fromTokenId,
      fromTxnId: this.fromTxnId,
      toAddr: this.toAddr,
      toAmountAtom: this.toAmountAtom,
      toTokenId: this.toTokenId,
      toTxnId: this.toTxnId,
      txnStatus: this.txnStatus,
    };
    return bridgeTxnObject;
    // return Object.assign(bridgeTxnObject, this);
  }

  /**
   * Transform the {@link BridgeTxn} to a JSON string.
   *
   * @returns The JSON string representation of the {@link BridgeTxn}
   */
  public toString(): string {
    return JSON.stringify(this.toSafeObject());
  }

  /* GETTERS */

  /**
   * UID of form \{DbId\}.\{TxnId\}
   *
   * @returns The UID of the {@link BridgeTxn}
   */
  get uid(): string {
    if (this.dbId === undefined) {
      this.dbId = this.getDbId();
    }
    return parseTxnUid(`${this.dbId}.${this.fromTxnId}`);
  }

  get #fromBlockchain(): Blockchain {
    return getTokenImplBlockchain(this.fromTokenId);
  }
  get #toBlockchain(): Blockchain {
    return getTokenImplBlockchain(this.toTokenId);
  }

  protected get bridgeInfo() {
    return getBridgeInfo(this.fromTokenId, this.toTokenId);
  }
  /**
   * Get a defined dbId of the {@link BridgeTxn} for TS type checking.
   *
   * @throws {@link ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR} if the {@link BridgeTxn.dbId} is not defined
   * @throws {@link ERRORS.INTERNAL.BRIDGE_TXN_NOT_INITIALIZED} if the {@link BridgeTxn} is not initialized
   * @returns The dbId of the {@link BridgeTxn} as a number
   */
  public getDbId(): number {
    if (this.dbId === undefined) {
      throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_NOT_INITIALIZED, {
        extraMsg: 'try to get dbId before BridgeTxn is initialized',
        at: 'BridgeTxn.getDbId',
      });
    } else {
      return this.dbId;
    }
  }

  /**  PRIVATE METHODS - CLASS INIT  **/

  /**
   * Synchronously validate the {@link BridgeTxn} itself.
   * Check the fromAmountAtom is greater than fixedFeeAtom.
   * Not check if it's already in the database, because it's async. This check happens in {@link createInDb}.
   * This is one step of the initialization.
   *
   * @throws {@link ERRORS.INTERNAL.INVALID_BRIDGE_TXN_PARAM} if the {@link BridgeTxn.txnParam} is invalid
   * @throws {@link ERRORS.INTERNAL.INVALID_AMOUNT} if the {@link BridgeTxn.fromAmountAtom} is less than fixed fee
   * @returns The {@link BridgeTxn} itself
   */
  private _selfValidate(): this {
    if (this.fromAmountAtom < this.fixedFeeAtom) {
      throw new BridgeError(ERRORS.INTERNAL.INVALID_AMOUNT, {
        fromAmountAtom: this.fromAmountAtom,
      });
    }

    // TODO: (ANB-126) verify to_address is legal with indexer.

    // TBD: (ANB-127) we can also do a min/max of amount check here.
    return this;
  }

  /**
   * Get the {@link fixedFeeAtom} of the {@link BridgeTxn}.
   *
   * @internal
   * @throws {@link ERRORS.INTERNAL.UNKNOWN_TXN_TYPE} if the {@link BridgeTxn.txnType} is invalid
   * @returns The fixedFeeAtom as a bigint
   */
  private _readFixedFeeAtom(): bigint {
    const fixedFee: number = this.bridgeInfo.fixedFee;
    this.fixedFeeAtom = this.bridgeInfo.amountParser(fixedFee);
    return this.fixedFeeAtom;
  }

  /**
   * Calculate the {@link marginFeeAtom} of the {@link BridgeTxn}.
   *
   * @internal
   * @throws {@link ERRORS.INTERNAL.UNKNOWN_TXN_TYPE} if the {@link BridgeTxn.txnType} is invalid
   * @returns The marginFeeAtom
   */
  private _calculateMarginFeeAtom(): bigint {
    const marginBips: number = this.bridgeInfo.marginBips;

    const marginFee: bigint = bigintBips(
      this.fromAmountAtom,
      BigInt(marginBips)
    );
    this.marginFeeAtom = marginFee;

    return marginFee;
  }

  /**
   * Calculate the {@link toAmountAtom} of the {@link BridgeTxn}.
   * This is one step of the initialization.
   *
   * @internal
   * @returns The totalFeeAtom as a bigint
   */
  private _calculateToAmountAtom(): bigint {
    const toAmount: bigint =
      this.fromAmountAtom - this.fixedFeeAtom - this.marginFeeAtom;

    this.toAmountAtom = toAmount;
    return toAmount;
  }

  /* PRIVATE METHODS - DATABASE */

  /**
   * Create the {@link BridgeTxn} in the database after checking if it already exists.
   * This is the last step of the initialization.
   *
   * @public
   * @throws {@link ERRORS.INTERNAL.DB_NOT_CONNECTED} if the database is not connected
   * @throws {@link ERRORS.API.REUSED_INCOMING_TXN} if the incoming txn is already used
   * @throws {@link ERRORS.EXTERNAL.DB_CREATE_TXN_FAILED} if the database create txn failed
   * @returns Promise the dbId of the created {@link BridgeTxn}
   */
  public async createInDb(): Promise<DbId> {
    if (!this.#db.isConnected) {
      throw new BridgeError(ERRORS.INTERNAL.DB_NOT_CONNECTED, {
        at: 'BridgeTxn.createInDb',
        db: this.#db,
      });
    }

    // make sure fromTxnId is never used before
    // possible improvement: make sure transaction is finished recently, check a wider range in db
    const dbEntryWithTxnId = await this.#db.readTxnFromTxnId(this.fromTxnId);
    if (dbEntryWithTxnId.length > 0) {
      // await this._updateTxnStatus(BridgeTxnStatusEnum.ERR_VERIFY_INCOMING);
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
        at: 'BridgeTxn._createInDb',
        error: err,
        bridgeTxn: this,
      });
    }

    // for jest testing
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!this.#db.isConnected) {
      throw new BridgeError(ERRORS.INTERNAL.DB_NOT_CONNECTED, {
        at: 'BridgeTxn._updateTxnStatus',
      });
    }
    this._isCreatedInDb = true;

    return this.dbId;
  }

  /**
   * Update the {@link BridgeTxn} in the database.
   * This wraps the {@link db.updateTxn} method.
   * Only called in two places: {@link BridgeTxn._updateTxnStatus} and {@link BridgeTxn._updateToTxnId}.
   *
   * @internal
   * @throws {@link ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR} if the {@link BridgeTxn} is not initialized
   * @throws {@link ERRORS.INTERNAL.DB_NOT_CONNECTED} if the database is not connected
   * @returns Promise
   */
  private async _updateTxn(): Promise<DbId> {
    if (!this.#db.isConnected) {
      throw new BridgeError(ERRORS.INTERNAL.DB_NOT_CONNECTED, {
        at: 'BridgeTxn._updateTxnStatus',
      });
    }
    try {
      return await this.#db.updateTxn(this);
    } catch (e) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_UPDATE_TXN_FAILED, {
        at: 'BridgeTxn._updateTxn',
        error: JSON.stringify(e),
        bridgeTxn: this,
      });
    }
  }

  /**
   * Update the {@link BridgeTxn.txnStatus} field in the instance and database.
   * Throw error if current txnStatus is already error.
   * @internal
   * @throws {@link ERRORS.INTERNAL.OVERWRITE_ERROR_TXN_STATUS} if the {@link BridgeTxn.txnStatus} is already set
   * @param newStatus - New status {@link BridgeTxnStatusEnum} of the {@link BridgeTxn}
   * @returns Promise the primary key of table {@link DbId} of the updated {@link BridgeTxn}
   */
  private async _updateTxnStatus(
    newStatus: BridgeTxnStatusEnum
  ): Promise<DbId> {
    // TODO: [BTSE] have a hierarchy tree of status. newStatus can only be one of the
    // TODO: [BTSE] children of this. txnStatus to check if update if valid
    if (
      [
        BridgeTxnStatusEnum.ERR_AWS_RDS_DB,
        BridgeTxnStatusEnum.ERR_CONFIRM_OUTGOING,
        BridgeTxnStatusEnum.ERR_INITIALIZE,
        BridgeTxnStatusEnum.ERR_MAKE_OUTGOING,
        BridgeTxnStatusEnum.ERR_SEVER_INTERNAL,
        BridgeTxnStatusEnum.ERR_TIMEOUT_INCOMING,
        BridgeTxnStatusEnum.ERR_CONFIRM_OUTGOING,
      ].includes(this.txnStatus)
    ) {
      throw new BridgeError(ERRORS.INTERNAL.OVERWRITE_ERROR_TXN_STATUS, {
        bridgeTxn: this,
      });
    }
    log.BTXN.onUpdateStatus(this.uid, newStatus);
    this.txnStatus = newStatus;
    log.BTXN.onUpdateStatusDone(this.uid, newStatus);
    try {
      return await this._updateTxn();
    } catch (e) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_UPDATE_TXN_FAILED, {
        at: 'BridgeTxn._updateTxnStatus',
        error: JSON.stringify(e),
        bridgeTxn: this,
      });
    }
  }

  /**
   * Update the {@link BridgeTxn.toTxnId} field in the instance and database.
   *
   * @internal
   * @throws {@link ERRORS.INTERNAL.OVERWRITE_TO_TXN_ID} if the {@link BridgeTxn.toTxnId} is already set
   * @param toTxnId - New {@link BridgeTxn.toTxnId} of the {@link BridgeTxn}
   * @returns Promise of the primary key of table {@link DbId}  of the updated {@link BridgeTxn}
   */
  private async _updateToTxnId(toTxnId: TxnId): Promise<DbId> {
    const isOverwriting =
      this.toTxnId !== undefined &&
      this.toTxnId !== null &&
      this.toTxnId !== toTxnId;

    if (isOverwriting) {
      throw new BridgeError(ERRORS.INTERNAL.OVERWRITE_TO_TXN_ID, {
        bridgeTxn: this,
      });
    }
    this.toTxnId = toTxnId;
    try {
      return await this._updateTxn();
    } catch (e) {
      throw new BridgeError(ERRORS.EXTERNAL.DB_UPDATE_TXN_FAILED, {
        at: 'BridgeTxn._updateToTxnId',
        error: JSON.stringify(e),
        bridgeTxn: this,
      });
    }
  }
}
