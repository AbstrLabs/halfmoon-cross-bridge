// TODO: no need to infer TxnType anymore.
export { type BridgeTxnObj, BridgeTxn };

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

interface CriticalBridgeTxnObj {
  dbId?: number;
  fixedFeeAtom?: bigint;
  marginFeeAtom?: bigint;
  fromAddr: string;
  fromAmountAtom: bigint;
  fromBlockchainName?: BlockchainName;
  fromTxnId: string;
  toAddr: string;
  toAmountAtom?: bigint;
  toBlockchainName?: BlockchainName;
  txnStatus?: BridgeTxnStatus;
  toTxnId?: string;
  txnType: TxnType;
  createdTime?: bigint;
}

interface BridgeTxnObj extends CriticalBridgeTxnObj {
  dbId?: number;
  fixedFeeAtom: bigint;
  marginFeeAtom: bigint;
  createdTime: bigint;
  fromAddr: string;
  fromAmountAtom: bigint;
  fromBlockchainName: BlockchainName;
  fromTxnId: string;
  toAddr: string;
  toAmountAtom: bigint;
  toBlockchainName: BlockchainName;
  toTxnId?: string;
  txnStatus: BridgeTxnStatus;
  txnType: TxnType;
}

/**
 * @classdesc BridgeTxn is a transaction that is used to transfer tokens between two different blockchains.
 *
 * @param  {CriticalBridgeTxnObj} bridgeTxnObject
 * @param  {InitializeOptions} initializeOptions
 */
class BridgeTxn implements CriticalBridgeTxnObj {
  dbId?: number;
  fixedFeeAtom: bigint;
  marginFeeAtom: bigint;
  createdTime: bigint;
  fromAddr: string;
  fromAmountAtom: bigint;
  fromBlockchainName?: BlockchainName;
  fromTxnId: string;
  toAddr: string;
  toAmountAtom: bigint;
  toBlockchainName?: BlockchainName;
  txnStatus: BridgeTxnStatus;
  toTxnId?: string;
  txnType: TxnType;
  #db = db;
  #fromBlockchain!: Blockchain;
  #toBlockchain!: Blockchain;
  #isCreatedInDbPromise: Promise<boolean>;

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
    const { from, to, amount, txnId } = apiCallParam;
    const bridgeTxn = new BridgeTxn({
      dbId: undefined,
      txnType: apiCallParam.type,
      fixedFeeAtom: undefined,
      fromAddr: from,
      fromAmountAtom: toGoNearAtom(amount),
      fromBlockchainName: undefined,
      fromTxnId: txnId,
      marginFeeAtom: undefined,
      createdTime,
      toAddr: to,
      toAmountAtom: undefined,
      toBlockchainName: undefined,
      toTxnId: undefined,
      txnStatus: BridgeTxnStatus.DOING_INITIALIZE,
    });
    return bridgeTxn;
  }

  /**
   * Initialize a {@link BridgeTxn} from the given {@link DbItem}.
   *
   * @static
   * @param  {DbItem} dbItem
   * @param  {TxnType} dbName
   * @returns {BridgeTxn} - the {@link BridgeTxn} constructed
   */
  static fromDbItem(dbItem: DbItem, dbName: TxnType): BridgeTxn {
    const _dbItem = parseDbItem(dbItem);
    const bridgeTxn: BridgeTxn = new BridgeTxn({
      dbId: _dbItem.db_id,
      txnType: dbName,

      fixedFeeAtom: BigInt(_dbItem.fixed_fee_atom),
      fromAddr: _dbItem.from_addr,
      fromAmountAtom: BigInt(_dbItem.from_amount_atom),
      fromBlockchainName: undefined,
      fromTxnId: _dbItem.from_txn_id,
      marginFeeAtom: BigInt(_dbItem.margin_fee_atom),
      createdTime: BigInt(_dbItem.created_time),
      toAddr: _dbItem.to_addr,
      toAmountAtom: BigInt(_dbItem.to_amount_atom),
      toBlockchainName: undefined,
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
      fromBlockchainName: fromBlockchain,
      fromTxnId,
      toAddr,
      toAmountAtom,
      toBlockchainName: toBlockchain,
      txnStatus,
      txnType,
      toTxnId,
      dbId,
    }: CriticalBridgeTxnObj,
    initializeOptions: InitializeOptions = {
      notCreateInDb: false,
    }
  ) {
    this.fromAmountAtom = fromAmountAtom;
    this.txnType = txnType;
    this.fromAddr = fromAddr;
    this.fromAmountAtom = fromAmountAtom;
    this.fromBlockchainName = fromBlockchain;
    this.fromTxnId = fromTxnId;
    this.toAddr = toAddr;
    this.toBlockchainName = toBlockchain;
    this.toTxnId = toTxnId;
    this.dbId = dbId;
    this._inferBlockchainNames();
    this._hookBlockchain();

    try {
      // Below will be overwritten if instantiated with value.
      this.fixedFeeAtom = fixedFeeAtom ?? this._readFixedFeeAtom();
      this.marginFeeAtom = marginFeeAtom ?? this._calculateMarginFeeAtom();
      this.createdTime = createdTime ?? BigInt(+Date.now());
      this.toAmountAtom = toAmountAtom ?? this._calculateToAmountAtom();
      this.txnStatus = txnStatus ?? BridgeTxnStatus.DOING_INITIALIZE;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      this.txnStatus = BridgeTxnStatus.ERR_INITIALIZE;
      throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR, {
        at: 'BridgeTxn._initialize',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
        err: err.toString(),
      });
    }
    this._selfValidate();
    this.txnStatus = BridgeTxnStatus.DONE_INITIALIZE;

    // TODO: maybe a `static async asyncConstruct(){}` is better?
    this.#isCreatedInDbPromise = new Promise((resolve, reject) => {
      if (!initializeOptions.notCreateInDb) {
        this.createInDb()
          .then(() => {
            resolve(true);
          })
          .catch((err) => {
            logger.error(err);
            reject(false);
          });
      } else {
        resolve(false);
      }
    });
    return this;
  }

  /* MAKE BRIDGE TRANSACTION */
  // process according to sequence diagram

  /**
   * Run the whole mint or burn process of the {@link BridgeTxn} and wrap the result in a {@link BridgeTxnObj}.
   * This should be the only way used outside the {@link BridgeTxn} class.
   *
   * @async
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.BRIDGE_TXN_NOT_INITIALIZED} if the {@link BridgeTxn} is not initialized
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR} if the {@link BridgeTxn} is not initialized
   * @returns {Promise<BridgeTxnObj>} - the {@link BridgeTxnObj} representing the {@link BridgeTxn}
   */
  async runWholeBridgeTxn(): Promise<BridgeTxnObj> {
    if (!(await this.#isCreatedInDbPromise)) {
      throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR, {
        at: 'BridgeTxn.runWholeBridgeTxn',
      });
    }
    if (
      this.fromBlockchainName === undefined ||
      this.toBlockchainName === undefined
    ) {
      throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_NOT_INITIALIZED, {
        at: 'BridgeTxn.runWholeBridgeTxn',
        reason: 'fromBlockchain or toBlockchain is undefined',
      });
    }

    logger.info(
      literals.MAKING_TXN(
        `${this.fromBlockchainName}->${this.toBlockchainName}`,
        this.fromAmountAtom,
        this.fromAddr,
        this.toAddr
      )
    );
    const isInitialized = await this.#isCreatedInDbPromise;
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

  /**
   * Confirm the incoming transaction of the {@link BridgeTxn}.
   *
   * @async
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR} if the {@link BridgeTxn} is not initialized
   * @emit change the txnStatus from {@link BridgeTxnStatus.DONE_INITIALIZE} to {@link BridgeTxnStatus.DONE_CONFIRM_INCOMING_TXN} or the corresponding errors.
   * @returns {Promise<void>} promise of void
   */
  async confirmIncomingTxn(): Promise<void> {
    await this.#isCreatedInDbPromise;
    if (!(await this.#isCreatedInDbPromise)) {
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

    await this._updateTxnStatus(BridgeTxnStatus.DONE_INCOMING);
  }

  /**
   * Make the outgoing transaction of the {@link BridgeTxn}.
   *
   * @async
   * @throws {BridgeError} - {@link ERRORS.EXTERNAL.EMPTY_NEW_TXN_ID} if the {@link BridgeTxn#toTxnId} is empty.
   * @throws {BridgeError} - {@link ERRORS.EXTERNAL.MAKE_OUTGOING_TXN_FAILED} if the {@link BridgeTxn#toBlockchainName} fails to make the outgoing transaction.
   * @emit change the txnStatus from {@link BridgeTxnStatus.CONFIRM_INCOMING_TXN} to {@link BridgeTxnStatus.DOING_OUTGOING} or the corresponding errors.
   * @returns {Promise<void>} promise of void
   */
  async makeOutgoingTxn(): Promise<void> {
    this._checkStatus(BridgeTxnStatus.DONE_INCOMING, 'makeOutgoingTxn');

    let outgoingTxnId: TxnId;
    try {
      await this._updateTxnStatus(BridgeTxnStatus.DOING_OUTGOING);
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
      await this._updateToTxnId(outgoingTxnId);
    } catch (err) {
      await this._updateTxnStatus(BridgeTxnStatus.ERR_MAKE_OUTGOING);
      throw new BridgeError(ERRORS.EXTERNAL.MAKE_OUTGOING_TXN_FAILED, {
        bridgeTxn: this,
        err,
      });
    }
  }

  /**
   * Verify the outgoing transaction of the {@link BridgeTxn}.
   *
   * @async
   * @throws {BridgeError} - {@link ERRORS.EXTERNAL.CONFIRM_OUTGOING_TXN_FAILED} if the verification fails
   * @emit change the txnStatus from {@link BridgeTxnStatus.DOING_OUTGOING} to {@link BridgeTxnStatus.DONE_OUTGOING} or the corresponding errors.
   * @returns {Promise<void>} promise of void
   */
  async verifyOutgoingTxn(): Promise<void> {
    this._checkStatus(BridgeTxnStatus.DOING_OUTGOING, 'verifyOutgoingTxn');
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
      this.fromBlockchainName === other.fromBlockchainName &&
      this.fromTxnId === other.fromTxnId &&
      this.toAddr === other.toAddr &&
      //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.toAmountAtom.toString() === other.toAmountAtom.toString() &&
      this.toBlockchainName === other.toBlockchainName &&
      this.toTxnId === other.toTxnId &&
      this.txnStatus === other.txnStatus &&
      this.txnType === other.txnType &&
      this.dbId === other.dbId &&
      //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.fixedFeeAtom.toString() === other.fixedFeeAtom.toString() &&
      //eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.marginFeeAtom.toString() === other.marginFeeAtom.toString() &&
      this.createdTime.toString() === other.createdTime.toString()
    );
  }

  /**
   * Transform the {@link BridgeTxn} to an object with all info, wrapping up all important fields.
   *
   * @returns {BridgeTxnObj} the object representation of the {@link BridgeTxn}
   */
  public toObject(): BridgeTxnObj {
    if (
      this.fromBlockchainName === undefined ||
      this.toBlockchainName === undefined
    ) {
      throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_NOT_INITIALIZED, {
        at: 'BridgeTxn.toObject',
        reason: 'undefined field(s)',
      });
    }
    // this._initialize({ notCreateInDb: true }); // this makes all fields non-null
    const bridgeTxnObject: BridgeTxnObj = {
      dbId: this.dbId,
      fixedFeeAtom: this.fixedFeeAtom, // eslint-disable-line @typescript-eslint/no-non-null-assertion
      marginFeeAtom: this.marginFeeAtom, // eslint-disable-line @typescript-eslint/no-non-null-assertion
      createdTime: this.createdTime,
      fromAddr: this.fromAddr,
      fromAmountAtom: this.fromAmountAtom,
      fromBlockchainName: this.fromBlockchainName,
      fromTxnId: this.fromTxnId,
      toAddr: this.toAddr,
      toAmountAtom: this.toAmountAtom,
      toBlockchainName: this.toBlockchainName, // eslint-disable-line @typescript-eslint/no-non-null-assertion
      toTxnId: this.toTxnId,
      txnStatus: this.txnStatus,
      txnType: this.txnType,
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
    return JSON.stringify(this.toObject());
  }

  /* GETTERS */

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
   * Infer the blockchain names of the {@link BridgeTxn}.
   * This is one step of the initialization.
   *
   * @deprecated this should be done on receiving the request, not here.
   * @private
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.UNKNOWN_TXN_TYPE} if the {@link BridgeTxn} is invalid
   * @returns {{fromBlockchain: BlockchainName; toBlockchain: BlockchainName;}} the blockchain names
   */
  private _inferBlockchainNames(): {
    fromBlockchain: BlockchainName;
    toBlockchain: BlockchainName;
  } {
    // TODO: deprecate this
    if (
      this.fromBlockchainName !== undefined &&
      this.toBlockchainName !== undefined
    ) {
      return {
        fromBlockchain: this.fromBlockchainName,
        toBlockchain: this.toBlockchainName,
      };
    }

    let fromBlockchain: BlockchainName;
    let toBlockchain: BlockchainName;
    if (this.txnType === TxnType.MINT) {
      fromBlockchain = BlockchainName.NEAR;
      toBlockchain = BlockchainName.ALGO;
      // for extendability, we can add more txn types here.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (this.txnType === TxnType.BURN) {
      fromBlockchain = BlockchainName.ALGO;
      toBlockchain = BlockchainName.NEAR;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
        txnType: this.txnType,
      });
    }
    this.fromBlockchainName = fromBlockchain;
    this.toBlockchainName = toBlockchain;
    return { fromBlockchain, toBlockchain };
  }

  /**
   * Hook the blockchains of the {@link BridgeTxn}.
   * This is one step of the initialization.
   *
   * @private
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.UNKNOWN_BLOCKCHAIN_NAME} if the {@link BridgeTxn} blockchain names is invalid
   * @returns void
   */
  private _hookBlockchain(): void {
    if (
      this.fromBlockchainName === undefined ||
      this.toBlockchainName === undefined
    ) {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_BLOCKCHAIN_NAME, {
        fromBlockchain: this.fromBlockchainName,
        toBlockchain: this.toBlockchainName,
        at: 'BridgeTxn._hookBlockchain',
      });
    }
    this._hookFromBlockchain();
    this._hookToBlockchain();
  }
  /**
   * Hook the fromBlockchain of the {@link BridgeTxn}.
   * Only used in {@link _hookBlockchain}
   *
   * @private
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.UNKNOWN_BLOCKCHAIN_NAME} if the blockchain name is unknown
   * @returns void
   */
  private _hookFromBlockchain(): void {
    if (this.fromBlockchainName === BlockchainName.NEAR) {
      this.#fromBlockchain = nearBlockchain;
    } else if (this.fromBlockchainName === BlockchainName.ALGO) {
      this.#fromBlockchain = algoBlockchain;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_BLOCKCHAIN_NAME, {
        fromBlockchain: this.fromBlockchainName,
        at: 'BridgeTxn._hookBlockchain',
      });
    }
  }
  /**
   * Hook the toBlockchain of the {@link BridgeTxn}.
   * Only used in {@link _hookBlockchain}
   *
   * @private
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.UNKNOWN_TXN_TYPE} if the {@link BridgeTxn.txnType} is invalid
   * @returns void
   */
  private _hookToBlockchain(): void {
    if (this.toBlockchainName === BlockchainName.NEAR) {
      this.#toBlockchain = nearBlockchain;
    } else if (this.toBlockchainName === BlockchainName.ALGO) {
      this.#toBlockchain = algoBlockchain;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_BLOCKCHAIN_NAME, {
        toBlockchain: this.toBlockchainName,
        at: 'BridgeTxn._hookBlockchain',
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
    let fixedFee: bigint;
    if (this.txnType === TxnType.MINT) {
      fixedFee = toGoNearAtom(ENV.BURN_FIX_FEE);
    } else if (
      // for extendability, we can add more txn types here.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      this.txnType === TxnType.BURN
    ) {
      fixedFee = toGoNearAtom(ENV.MINT_FIX_FEE);
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
        txnType: this.txnType,
      });
    }

    this.fixedFeeAtom = fixedFee;
    return fixedFee;
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
    let marginBips: number;
    if (this.txnType === TxnType.MINT) {
      marginBips = ENV.MINT_MARGIN_FEE_BIPS;
    } else if (
      // for extendability, we can add more txn types here.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      this.txnType === TxnType.BURN
    ) {
      marginBips = ENV.BURN_MARGIN_FEE_BIPS;
    } else {
      throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
        txnType: this.txnType,
      });
    }

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
        at: 'BridgeTxn._createInDb',
        db: this.#db,
      });
    }

    // create is inside _initialize() method, so we can't check if is initialized.
    // if (!(await this.#isInitializedPromise)) {
    //   throw new BridgeError(ERRORS.INTERNAL.BRIDGE_TXN_INITIALIZATION_ERROR, {
    //     message: 'BridgeTxn is not initialized',
    //     at: 'BridgeTxn._createInDb',
    //   });
    // }

    // make sure fromTxnId is never used before
    // possible improvement: make sure transaction is finished recently, check a wider range in db
    const dbEntryWithTxnId = await this.#db.readTxnFromTxnId(
      this.fromTxnId,
      this.txnType
    );
    if (dbEntryWithTxnId.length > 0) {
      // await this._updateTxnStatus(BridgeTxnStatus.ERR_VERIFY_INCOMING);
      throw new BridgeError(ERRORS.API.REUSED_INCOMING_TXN, {
        at: 'BridgeTxn.confirmIncomingTxn',
        bridgeTxn: this,
        txnId: this.fromTxnId,
      });
    }

    // try {
    this.dbId = await this.#db.createTxn(this);
    // !!!now
    // } catch (err) {
    //   throw new BridgeError(ERRORS.EXTERNAL.DB_CREATE_TXN_FAILED, {
    //     at: 'BridgeTxn._createInDb',
    //     error: err,
    //     bridgeTxn: this,
    //   });
    // }
    // if (!this.#db.isConnected) {
    //   throw new BridgeError(ERRORS.INTERNAL.DB_NOT_CONNECTED, {
    //     at: 'BridgeTxn._updateTxnStatus',
    //   });
    // }
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
   *
   * @async
   * @private
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.OVERWRITE_ERROR_TXN_STATUS} if the {@link BridgeTxn.txnStatus} is already set
   * @param  {BridgeTxnStatus} newStatus
   * @returns {Promise<DbId>} the database primary key of the updated {@link BridgeTxn}
   */
  private async _updateTxnStatus(newStatus: BridgeTxnStatus): Promise<DbId> {
    // TODO: have a hierarchy tree of status. newStatus can only be one of the children of this.txnStatus
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
    this.txnStatus = newStatus;
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
    if (this.toTxnId !== undefined) {
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
   * @private
   * @throws {BridgeError} - {@link ERRORS.INTERNAL.ILLEGAL_TXN_STATUS} if the txnStatus is not equal to the expected status
   * @param  {BridgeTxnStatus} expected
   * @param  {string} at
   * @returns void
   */
  private _checkStatus(expected: BridgeTxnStatus, at: string): void {
    if (!(this.txnStatus === expected)) {
      throw new BridgeError(ERRORS.INTERNAL.ILLEGAL_TXN_STATUS, {
        at: `BridgeTxn.${at}`,
        bridgeTxn: this,
      });
    }
  }
}
