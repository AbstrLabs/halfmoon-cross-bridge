/**
 * @todo - maybe split bridge and bridge-txn
 */
export {
  type BridgeTxnObj,
  type BridgeTxnSafeObj,
  BridgeTxn,
  BridgeTxnActionName,
};

import {
  ApiCallParam,
  DbId,
  DbItem,
  TxnId,
  parseDbItem,
  parseTxnUid,
} from '../utils/type/type';
import { Blockchain, ConfirmOutcome } from '../blockchain';
import { BlockchainName, BridgeTxnActionName, BridgeTxnStatusEnum } from '..';
import { BridgeError, ERRORS } from '../utils/errors';

import { algoBlockchain } from '../blockchain/algorand';
import { db } from '../database/db';
import { stringifyBigintInObj, toGoNearAtom } from '../utils/formatter';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';
import { nearBlockchain } from '../blockchain/near';
import { Token, TOKEN_TABLE } from './token-table';
import { getBridgeInfo } from './bridge-info';
import { TokenId } from '../utils/type/shared-types';

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
  dbId?: number;
  fixedFeeAtom: bigint;
  marginFeeAtom: bigint;
  createdTime: bigint;
  toAmountAtom: bigint;
  txnStatus: BridgeTxnStatusEnum;
}

interface BridgeTxnSafeObj {
  // TODO: type better (addr,txnId)
  dbId: number | string;
  fixedFeeAtom: string;
  marginFeeAtom: string;
  createdTime: string;
  fromAddr: string;
  fromAmountAtom: string;
  fromTokenId: TokenId;
  fromTxnId: string;
  toAddr: string;
  toAmountAtom: string;
  toTokenId: TokenId;
  toTxnId?: string | null;
  txnStatus: BridgeTxnStatusEnum;
}

type BridgeTxnAction = {
  [methodName in BridgeTxnActionName]: () => Promise<void>;
};

/**
 * @classdesc BridgeTxn is a transaction that is used to transfer tokens between two different blockchains.
 *
 * @param  {BridgeTxnObjBase} bridgeTxnObject
 * @param  {InitializeOptions} initializeOptions
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
  #db = db;
  #fromBlockchain: Blockchain;
  #fromToken: Token;
  #toBlockchain: Blockchain;
  #toToken: Token;
  #isCreatedInDb: boolean;

  /* CONSTRUCTORS  */

  /**
   * Initialize a {@link BridgeTxn} from the given {@link ApiCallParam}. Will use system time as default.
   *
   * @static
   * @param  {ApiCallParam} apiCallParam - The API call parameter to initialize the {@link BridgeTxn} from.
   * @param  {bigint} createdTime - optional, if not provided, will use system time
   * @returns {BridgeTxn} - the {@link BridgeTxn} constructed
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
      fromAmountAtom: toGoNearAtom(amount),
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
   * @static
   * @param  {DbItem} dbItem
   * @returns {BridgeTxn} - the {@link BridgeTxn} constructed
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
    bridgeTxn.#isCreatedInDb = true;
    return bridgeTxn;
  }

  static fromObject(safeObj: BridgeTxnSafeObj) {
    const bridgeTxn: BridgeTxn = new BridgeTxn({
      dbId:
        typeof safeObj.dbId === 'number'
          ? safeObj.dbId
          : parseInt(safeObj.dbId),
      fixedFeeAtom: BigInt(safeObj.fixedFeeAtom),
      fromAddr: safeObj.fromAddr,
      fromAmountAtom: BigInt(safeObj.fromAmountAtom),
      fromTokenId: safeObj.fromTokenId,
      fromTxnId: safeObj.fromTxnId,
      marginFeeAtom: BigInt(safeObj.marginFeeAtom),
      createdTime: BigInt(safeObj.createdTime),
      toAddr: safeObj.toAddr,
      toAmountAtom: BigInt(safeObj.toAmountAtom),
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
    this.#isCreatedInDb = false;

    this.fromTokenId = fromTokenId;
    this.toTokenId = toTokenId;
    this.#fromToken = TOKEN_TABLE[this.fromTokenId];
    this.#toToken = TOKEN_TABLE[this.toTokenId];
    this.#fromBlockchain = this._getBlockchain(this.#fromToken.implBlockchain);
    this.#toBlockchain = this._getBlockchain(this.#toToken.implBlockchain);

    this.fromTxnId = fromTxnId;
    this.fromAmountAtom = fromAmountAtom;
    this.fromAddr = fromAddr;
    this.fromAmountAtom = fromAmountAtom;
    this.toAddr = toAddr;
    this.toTxnId = toTxnId;
    this.dbId = dbId;

    try {
      // Below will be overwritten if instantiated with value.
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
   * Run the whole mint or burn process of the {@link BridgeTxn} and wrap the result in a {@link BridgeTxnObj}.
   * This should be the only way used outside the {@link BridgeTxn} class.
   *
   * @deprecated - use new state pattern instead
   *
   * @async
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.BRIDGE_TXN_NOT_INITIALIZED} if the {@link BridgeTxn} is not initialized
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR} if the {@link BridgeTxn} is not initialized
   * @returns {Promise<BridgeTxnObj>} - the {@link BridgeTxnObj} representing the {@link BridgeTxn}
   */
  async runWholeBridgeTxn(): Promise<BridgeTxnObj> {
    // TODO: should not create in db automatically
    if (!this.#isCreatedInDb) {
      await this.createInDb();
    }

    logger.info(
      literals.MAKING_TXN(
        `${this.#fromBlockchain.name}->${this.#toBlockchain.name}`,
        this.fromAmountAtom,
        this.fromAddr,
        this.toAddr
      )
    );

    await this.confirmIncomingTxn();
    await this.makeOutgoingTxn();
    await this.verifyOutgoingTxn();
    return this.toObject();
    // return this;
  }

  /**
   * Confirm the incoming transaction of the {@link BridgeTxn}.
   *
   * @async
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR} if the {@link BridgeTxn} is not initialized
   * @emit change the txnStatus from {@link BridgeTxnStatusEnum.DONE_INITIALIZE} to {@link BridgeTxnStatusEnum.DONE_CONFIRM_INCOMING_TXN} or the corresponding errors.
   * @returns {Promise<void>} promise of void
   */
  async confirmIncomingTxn(): Promise<void> {
    logger.verbose('[BTX]: running confirmIncomingTxn.');
    if (!this.#isCreatedInDb) {
      throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR, {
        at: 'BridgeTxn.confirmIncomingTxn',
        reason:
          'BridgeTxn should be created in DB before confirming incoming txn',
        bridgeTxn: this,
      });
    }
    this._checkStatus(
      BridgeTxnStatusEnum.DONE_INITIALIZE,
      'confirmIncomingTxn'
    );

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
   *
   * @async
   * @throws {BridgeError} - {@link ERRORS.EXTERNAL.EMPTY_NEW_TXN_ID} if the {@link BridgeTxn#toTxnId} is empty.
   * @throws {BridgeError} - {@link ERRORS.EXTERNAL.MAKE_OUTGOING_TXN_FAILED} if the {@link BridgeTxn#toBlockchainName} fails to make the outgoing transaction.
   * @emit change the txnStatus from {@link BridgeTxnStatusEnum.CONFIRM_INCOMING_TXN} to {@link BridgeTxnStatusEnum.DOING_OUTGOING} or the corresponding errors.
   * @returns {Promise<void>} promise of void
   */
  async makeOutgoingTxn(): Promise<void> {
    this._checkStatus(BridgeTxnStatusEnum.DONE_INCOMING, 'makeOutgoingTxn');

    let outgoingTxnId: TxnId;
    try {
      outgoingTxnId = await this.#toBlockchain.makeOutgoingTxn({
        fromAddr: this.#toBlockchain.centralizedAddr,
        toAddr: this.toAddr,
        atomAmount: this.toAmountAtom,
        txnId: literals.UNUSED,
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
   *
   * @async
   * @throws {BridgeError} - {@link ERRORS.EXTERNAL.CONFIRM_OUTGOING_TXN_FAILED} if the verification fails
   * @emit change the txnStatus from {@link BridgeTxnStatusEnum.DOING_OUTGOING} to {@link BridgeTxnStatusEnum.DONE_OUTGOING} or the corresponding errors.
   * @returns {Promise<void>} promise of void
   */
  async verifyOutgoingTxn(): Promise<void> {
    this._checkStatus(BridgeTxnStatusEnum.DOING_OUTGOING, 'verifyOutgoingTxn');
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
   * @param  {BridgeTxn} other
   * @returns {boolean} true if the two BridgeTxn are considered same
   *
   * @todo: Bigint with jest https://github.com/facebook/jest/issues/11617#issuecomment-1068732414
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
   * @returns {BridgeTxnObj} the object representation of the {@link BridgeTxn}
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
   * @returns {string} the JSON string representation of the {@link BridgeTxn}
   */
  public toString(): string {
    return JSON.stringify(this.toSafeObject());
  }

  /* GETTERS */

  /**
   * UID {DbId}.{TxnId}
   */
  get uid(): string {
    if (this.dbId === undefined) {
      this.dbId = this.getDbId();
    }
    return parseTxnUid(`${this.dbId}.${this.fromTxnId}`);
  }
  // get fromBlockchainName(): BlockchainName {
  //   return this.#fromBlockchain.name;
  // }
  // get toBlockchainName(): BlockchainName {
  //   return this.#toBlockchain.name;
  // }

  /**
   * Get a defined dbId of the {@link BridgeTxn} for TS type checking.
   *
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR} if the {@link BridgeTxn.dbId} is not defined
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.BRIDGE_TXN_NOT_INITIALIZED} if the {@link BridgeTxn} is not initialized
   * @returns {number} the dbId of the {@link BridgeTxn}
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
   * @private
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.INVALID_BRIDGE_TXN_PARAM} if the {@link BridgeTxn.txnParam} is invalid
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.INVALID_AMOUNT} if the {@link BridgeTxn.fromAmountAtom} is less than fixed fee
   * @returns {BridgeTxn} the {@link BridgeTxn} itself
   */
  private _selfValidate(): this {
    // if (this.fromBlockchain === undefined || this.toBlockchain === undefined) {
    //   throw new BridgeError(ERRORS.INTERNAL.INVALID_BRIDGE_TXN_PARAM, {
    //     at: 'BridgeTxn._selfValidate',
    //   });
    // }

    if (this.fromAmountAtom < this.fixedFeeAtom) {
      throw new BridgeError(ERRORS.INTERNAL.INVALID_AMOUNT, {
        fromAmountAtom: this.fromAmountAtom,
      });
    }

    // TODO: verify to address is legal with indexer.

    // TODO: (later) we can also do a min/max of amount check here.
    return this;
  }

  /**
   * Hook the blockchains of the {@link BridgeTxn}.
   * This is one step of the initialization.
   *
   * @private
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.UNKNOWN_BLOCKCHAIN_NAME} if the {@link BridgeTxn} blockchain names is invalid
   * @returns void
   */
  private _getBlockchain(blockchainName: BlockchainName): Blockchain {
    switch (blockchainName) {
      case BlockchainName.ALGO:
        return algoBlockchain;
      case BlockchainName.NEAR:
        return nearBlockchain;
      default:
        throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_BLOCKCHAIN_NAME, {
          blockchainName,
          at: 'BridgeTxn._getBlockchain',
        });
    }
  }

  /**
   * Get the {@link fixedFeeAtom} of the {@link BridgeTxn}.
   *
   * @private
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.UNKNOWN_TXN_TYPE} if the {@link BridgeTxn.txnType} is invalid
   * @returns {bigint} the fixedFeeAtom
   */
  private _readFixedFeeAtom(): bigint {
    const fixedFee: number = getBridgeInfo(
      this.fromTokenId,
      this.toTokenId
    ).fixedFee;
    this.fixedFeeAtom = toGoNearAtom(fixedFee);
    return this.fixedFeeAtom;
  }

  /**
   * Calculate the {@link marginFeeAtom} of the {@link BridgeTxn}.
   *
   * @private
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.UNKNOWN_TXN_TYPE} if the {@link BridgeTxn.txnType} is invalid
   * @returns {bigint} the marginFeeAtom
   *
   * @todo use a better algorithm to calculate the marginFeeAtom, not fake rounding up. (99.8% first, then minus)
   */
  private _calculateMarginFeeAtom(): bigint {
    const marginBips: number = getBridgeInfo(
      this.fromTokenId,
      this.toTokenId
    ).marginBips;

    const marginFee: bigint = // TODO: supposing no bigint overflow
      this.fromAmountAtom -
      (this.fromAmountAtom * (BigInt(10000) - BigInt(marginBips))) /
        BigInt(10000); // X-(X*(1-%)) instead of X*% for rounding.
    // algorithm discussed with algomint team.

    this.marginFeeAtom = marginFee;
    return marginFee;
  }

  /**
   * Calculate the {@link toAmountAtom} of the {@link BridgeTxn}.
   * This is one step of the initialization.
   *
   * @private
   * @returns {bigint} the totalFeeAtom
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
   * @async
   * @public
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.DB_NOT_CONNECTED} if the database is not connected
   * @throws {BridgeError} - {@link ERRORS.API.REUSED_INCOMING_TXN} if the incoming txn is already used
   * @throws {BridgeError} - {@link ERRORS.EXTERNAL.DB_CREATE_TXN_FAILED} if the database create txn failed
   * @returns {Promise<DbId>} the id of the created {@link BridgeTxn}
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
    this.#isCreatedInDb = true;

    return this.dbId;
  }

  /**
   * Update the {@link BridgeTxn} in the database.
   * This wraps the {@link db.updateTxn} method.
   * Only called in two places: {@link BridgeTxn._updateTxnStatus} and {@link BridgeTxn._updateToTxnId}.
   *
   * @async
   * @private
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR} if the {@link BridgeTxn} is not initialized
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.DB_NOT_CONNECTED} if the database is not connected
   * @returns Promise
   */
  private async _updateTxn(): Promise<DbId> {
    // if (this.txnStatus === undefined) {
    //   throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR, {
    //     at: 'BridgeTxn._updateTxnStatus',
    //   });
    // }
    if (!this.#db.isConnected) {
      throw new BridgeError(ERRORS.INTERNAL.DB_NOT_CONNECTED, {
        at: 'BridgeTxn._updateTxnStatus',
      });
    }
    try {
      return await this.#db.updateTxn(this); // TODO: err handling in this async
    } catch (e) {
      logger.error('error at _updateTxn', e);
      throw new BridgeError(ERRORS.EXTERNAL.DB_UPDATE_TXN_FAILED, {
        at: 'BridgeTxn._updateTxn',
        error: e,
        bridgeTxn: this,
      });
    }
  }

  /**
   * Update the {@link BridgeTxn.txnStatus} field in the instance and database.
   * Throw error if current txnStatus is already error.
   * @async
   * @private
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.OVERWRITE_ERROR_TXN_STATUS} if the {@link BridgeTxn.txnStatus} is already set
   * @param  {BridgeTxnStatusEnum} newStatus
   * @returns {Promise<DbId>} the database primary key of the updated {@link BridgeTxn}
   */
  private async _updateTxnStatus(
    newStatus: BridgeTxnStatusEnum
  ): Promise<DbId> {
    // TODO: have a hierarchy tree of status. newStatus can only be one of the children of this.txnStatus
    // TODO: check if update if valid
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
    logger.debug(`[BTX]: updating status of txn ${this.uid} to: ${newStatus}`);
    this.txnStatus = newStatus;
    logger.debug(
      `[BTX]: updated status of txn ${this.uid} to: ${this.txnStatus}`
    );
    try {
      return await this._updateTxn();
    } catch (e) {
      logger.error('error at _updateTxnStatus', e);
      throw new BridgeError(ERRORS.EXTERNAL.DB_UPDATE_TXN_FAILED, {
        at: 'BridgeTxn._updateTxnStatus',
        error: e,
        bridgeTxn: this,
      });
    }
  }

  /**
   * Update the {@link BridgeTxn.toTxnId} field in the instance and database.
   *
   * @async
   * @private
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.OVERWRITE_TO_TXN_ID} if the {@link BridgeTxn.toTxnId} is already set
   * @param  {TxnId} toTxnId
   * @returns {Promise<DbId>} the database primary key of the updated {@link BridgeTxn}
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
      logger.error('error at _updateToTxnId', e);
      throw new BridgeError(ERRORS.EXTERNAL.DB_UPDATE_TXN_FAILED, {
        at: 'BridgeTxn._updateToTxnId',
        error: e,
        bridgeTxn: this,
      });
    }
  }

  /* PRIVATE METHODS - HELPERS */

  /**
   * Helper to throw an error if the {@link BridgeTxn.txnStatus} is not equal to the expected status.
   *
   * @todo: make this a decorator.
   * @private
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.ILLEGAL_TXN_STATUS} if the txnStatus is not equal to the expected status
   * @param  {BridgeTxnStatusEnum} expected
   * @param  {string} at
   * @returns void
   */
  private _checkStatus(expected: BridgeTxnStatusEnum, at: string): void {
    if (!(this.txnStatus === expected)) {
      throw new BridgeError(ERRORS.INTERNAL.ILLEGAL_TXN_STATUS, {
        at: `BridgeTxn.${at}`,
        bridgeTxn: this,
      });
    }
  }
}
