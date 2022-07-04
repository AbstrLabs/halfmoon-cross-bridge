/**
 * Route for /algorand-near with POST and GET method.
 */
export { algorandNear };

import type { ApiCallParam, DbId, DbItem, TxnId, TxnUid } from '../utils/type';
import { parseApiCallParam, parseTxnUid } from '../utils/type';
import { ConfirmOutcome, TxnType } from '../blockchain';
import express, { Request, Response } from 'express';

import { BlockchainName, BridgeTxnStatusEnum } from '..';
import { BridgeTxn, BridgeTxnObj } from '../bridge';
import { WELCOME_JSON } from '.';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';
import { stringifyBigintInObj } from '../utils/formatter';
import { verifyBlockchainTxn } from '../blockchain/verify';
import { apiWorker } from '../bridge/api-worker';
import { db } from '../database/db';

const algorandNear = express.Router();

algorandNear.route('/algorand-near').get(handleGetCall).post(handlePostCall);

// TODO: refactor move to types with better typing
export interface PostReturn {
  BridgeTxnStatus: BridgeTxnStatusEnum;
  uid: TxnUid;
}

/**
 * Handle GET call on /algorand-near
 * return WELCOME_JSON if no uid is provided.
 *
 * @param  {Request} req
 * @param  {Response} res
 * @returns
 */
async function handleGetCall(req: Request, res: Response) {
  if (req.query.uid === undefined) {
    logger.info('[API]: handled GET /algorand-near without UID');
    res.json(WELCOME_JSON);
    return;
  }
  const uid: TxnUid = req.query.uid as string;

  // validate uid
  try {
    parseTxnUid(uid);
  } catch (err) {
    logger.info('[API]: handled GET /algorand-near with malformed UID');
    res.status(406).send('Wrong get param format');
    return;
  }

  const [dbId, txnId] = uid
    .split('.')
    .map((val, ind) => (ind === 0 ? parseInt(val) : val)) as [DbId, TxnId];

  // TODO: maybe shouldn't use db here for too much coupling.
  try {
    const dbItem: DbItem = await db.readTxn(dbId);

    if (dbItem.from_txn_id !== txnId) {
      logger.warn('[API]: handled GET /algorand-near with invalid UID');
      return res.status(406).send('Wrong get param format');
    }
    // TODO: [SAFE_JSON] add a toSafeObj() function to BridgeTxn
    const safeObj = stringifyBigintInObj(
      BridgeTxn.fromDbItem(dbItem).toObject()
    );
    logger.warn('[API]: handled GET /algorand-near with valid UID');

    return res.json(safeObj);
  } catch (err) {
    logger.error(err);
    return res.status(500).send('Internal server error.');
  }
}

/**
 * Handle POST call on /algorand-near
 * return WELCOME_JSON if no uid is provided.
 *
 * @param  {Request} req
 * @param  {Response} res
 */
async function handlePostCall(req: Request, res: Response) {
  const apiCallParam = verifyApiCallParamWithResp(req, res);
  if (apiCallParam === null) return;

  const verifyResult = await verifyBlockchainTxnWithResp(apiCallParam, res);
  if (verifyResult === null) return;

  const bridgeTxn = await createBridgeTxnWithResp(apiCallParam, res);
  if (bridgeTxn === null) return;

  logger.info('Handled API call: ' + JSON.stringify(apiCallParam));

  const postReturn: PostReturn = {
    BridgeTxnStatus: bridgeTxn.txnStatus,
    uid: parseTxnUid(bridgeTxn.uid),
  };
  res.status(200).json(postReturn);
  return bridgeTxn.uid;
}
function verifyApiCallParamWithResp(
  req: Request,
  res: Response
): ApiCallParam | null {
  try {
    const body = req.body as {
      type: TxnType;
      from: string;
      to: string;
      amount: string;
      txnId: string;
    };
    const apiCallParam = parseApiCallParam(body);
    return apiCallParam;
  } catch (err) {
    res.status(406).send('Wrong POST body');
    return null;
  }
}
/**
 *
 * @todo - verify within both ram and db.
 *
 * @param apiCallParam
 * @param res
 * @returns
 */
async function verifyBlockchainTxnWithResp(
  apiCallParam: ApiCallParam,
  res: Response
): Promise<ConfirmOutcome.SUCCESS | null> {
  const verifyBlockchainMap = {
    [TxnType.MINT]: BlockchainName.NEAR,
    [TxnType.BURN]: BlockchainName.ALGO,
  };

  let verifyResult: ConfirmOutcome;
  try {
    verifyResult = await verifyBlockchainTxn(
      apiCallParam,
      verifyBlockchainMap[apiCallParam.type]
    );
  } catch (err) {
    res.status(400).send('Invalid transaction');
    return null;
  }

  switch (verifyResult) {
    case ConfirmOutcome.SUCCESS:
      logger.silly('verifyBlockchainTxnWithResp: passed');
      return ConfirmOutcome.SUCCESS;
    case ConfirmOutcome.WRONG_INFO:
      res.status(406).send('Invalid transaction');
      return null;
    case ConfirmOutcome.TIMEOUT:
      res.status(500).send('Verify transaction time out');
      return null;
    default:
      res.status(500).send('Server error code ANB-001');
      return null;
  }
}
async function createBridgeTxnWithResp(
  apiCallParam: ApiCallParam,
  res: Response
): Promise<BridgeTxn | null> {
  try {
    const bridgeTxn: BridgeTxn = await apiWorker.create(apiCallParam);
    return bridgeTxn;
  } catch (err) {
    logger.error('unknown error, maybe db?');
    // db error happened once when I push.
    //06:54:51Z error : (ERR_CODE: ANB301): Cannot query in database service: {"connected":true,"err":{"errno":-60,"code":"ETIMEDOUT","syscall":"read"},"query":"\n      SELECT * FROM anb_request WHERE db_id = $1;\n    ","params":{"0":57}}
    logger.error(err);
    res.status(500).send('Internal server error.');
    return null;
  }
}

/**
 * @deprecated
 * @param apiCallParam
 * @param res
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function transactWithResp(apiCallParam: ApiCallParam, res: Response) {
  /* CONFIG */
  let bridgeTxnObject: BridgeTxnObj;
  const _literals =
    apiCallParam.type === TxnType.MINT
      ? { START: literals.START_MINTING, DONE: literals.DONE_MINT }
      : { START: literals.START_BURNING, DONE: literals.DONE_BURN };
  logger.info(
    _literals.START(apiCallParam.amount, apiCallParam.from, apiCallParam.to) +
      `txnId: ${apiCallParam.txnId}`
  );

  try {
    const bridgeTxn = await apiWorker.create(apiCallParam);
    // bridgeTxnObject = await _execute(bridgeTxn); // executed in main.ts bridgeWorker.run()
    bridgeTxnObject = await bridgeTxn.runWholeBridgeTxn();
    logger.info(_literals.DONE);
    // TODO: use different literal template than transact
  } catch (err) {
    logger.error(err);
    res.status(406).send('Missing required query params');
    res.end();
    return;
  }
  // TODO: [SAFE_JSON] add a toSafeObj() function to BridgeTxn
  const stringifiedBridgeTxnObject = stringifyBigintInObj(bridgeTxnObject);
  logger.info(
    'API call ended, returned:\n' + JSON.stringify(stringifiedBridgeTxnObject)
  );
  return res.json(stringifiedBridgeTxnObject);
}
