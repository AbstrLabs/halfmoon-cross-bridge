/** A singleton responsible for converting API call to initialized and
 * uploaded BridgeTxn.
 */
export { type ApiWorker, apiWorker };

import { ApiCallParam, TxnId } from '../utils/type/type';
import { BridgeTxn } from '../bridge';
import { logger } from '../utils/logger';
import { TokenId } from '../utils/type/shared-types/token';

// TODO: parse with zod
interface CriticalApiCallParam {
  to_token: TokenId;
  from_token: TokenId;
  txn_id: TxnId;
}

class ApiWorker {
  /* private */ queue: CriticalApiCallParam[];

  constructor() {
    this.queue = [];
  }

  public async create(apiCallParam: ApiCallParam) {
    // TODO: zod parse
    // TODO: only use fields in critical api call param
    const criticalApiCallParam: CriticalApiCallParam = apiCallParam;

    if (this._includes(criticalApiCallParam)) {
      throw new Error(
        'Txn already in creation queue ' + criticalApiCallParam.txn_id
      );
    }
    this._push(criticalApiCallParam);

    const bridgeTxn = BridgeTxn.fromApiCallParam(
      apiCallParam,
      BigInt(Date.now())
    );

    try {
      // BTX.createInDb compares BTX.fromTxnId with DbItem.from_txn_id and wil throw err
      await bridgeTxn.createInDb();
    } catch (err) {
      logger.error('[AWK]: Double mint: from_txn_id existed in db.');
      logger.error(err);
      this._remove(criticalApiCallParam);
      throw err;
    }

    // TODO: should we add more coupling to save execution time?
    // bridgeWorker._push(bridgeTxn);

    apiWorker._remove(criticalApiCallParam);

    logger.verbose(
      `[ApiWorker]: bridge txn created with uid: ${bridgeTxn.uid.toString()}`
    );

    return bridgeTxn;
  }

  private _remove(criticalApiCallParam: CriticalApiCallParam) {
    if (!this._includes(criticalApiCallParam)) {
      throw new Error('Txn not in creation queue');
    }

    this.queue = this.queue.filter(
      (ExistedCallParam) =>
        ExistedCallParam.txn_id !== criticalApiCallParam.txn_id
    );
    return true;
  }
  /* GETTERS & SETTERs */
  public get length() {
    return this.queue.length;
  }

  /* PRIVATE METHODS */

  private _includes(criticalApiCallParam: CriticalApiCallParam) {
    // FIX: this is SUPER dangerous, not sure if `includes` compares object (assumably not)
    return this.queue.includes(criticalApiCallParam);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  }
  private _push(criticalApiCallParam: CriticalApiCallParam) {
    this.queue.push(criticalApiCallParam);
  }
}

const apiWorker = new ApiWorker();
