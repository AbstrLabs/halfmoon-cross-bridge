/**
 * Route for /algorand-near with POST and GET method.
 *
 * @todo v0.3 change `/algorand-near` to `/txn`
 */
export { txnRoute };

import {
  ApiCallParam,
  DbId,
  DbItem,
  fullyParseApiParam,
  TxnId,
  TxnUid,
} from '../../utils/type/type';
import { parseTxnUid } from '../../utils/type/type';
import { ConfirmOutcome } from '../../blockchain/abstract-base';
import express, { Request, Response } from 'express';

import { BridgeTxn } from '../../bridge';
import { WELCOME_JSON } from '..';
import { verifyBlockchainTxn } from '../../blockchain/verify';
import { apiWorker } from '../api-worker';
import { db } from '../../database/db';
import { TokenId } from '../../common/src/type/token';
import { BridgeTxnStatusEnum } from '../../common/src/type/txn';
import { TXN_ROUTE_PATH } from '../../config';
import { log } from '../../utils/log/log-template';

const txnRoute = express.Router();

txnRoute.route(TXN_ROUTE_PATH).get(handleGetCall).post(handlePostCall);

// TODO: refactor move to types with better typing
export interface PostReturn {
  BridgeTxnStatus: BridgeTxnStatusEnum;
  uid: TxnUid;
}

/**
 * Handle GET call on /algorand-near
 * return WELCOME_JSON if no uid is provided.
 *
 * @param req - Express request
 * @param res - Express response
 * @returns
 */
async function handleGetCall(req: Request, res: Response) {
  if (req.query.uid === undefined) {
    log.APIS.handledGetWithoutUid();
    res.json(WELCOME_JSON);
    return;
  }
  const uid: TxnUid = req.query.uid as string;

  // validate uid
  try {
    parseTxnUid(uid);
  } catch (err) {
    log.APIS.handledGetWithMalformedUid(uid);
    res.status(406).send('Wrong GET param format');
    return;
  }

  const [dbId, txnId] = uid
    .split('.')
    .map((val, ind) => (ind === 0 ? parseInt(val) : val)) as [DbId, TxnId];

  // TODO: maybe shouldn't use db here, too much coupling.
  try {
    const dbItem: DbItem = await db.readTxn(dbId);
    // here the error handling is not good., because readTxn throws on fetch error and {0,>1} result.
    if (dbItem.from_txn_id !== txnId) {
      log.APIS.handledGetWithInvalidUid();
      return res.status(406).send('Transaction not found in database');
    }
    const safeObj = BridgeTxn.fromDbItem(dbItem).toSafeObject();
    log.APIS.handledGetWithValidUid();
    return res.json(safeObj);
  } catch (err) {
    log.APIS.generalError(err);
    return res.status(406).send('Internal server error.');
  }
}

/**
 * Handle POST call on /algorand-near
 * return WELCOME_JSON if no uid is provided.
 *
 * @param req - Express request
 * @param res - Express response
 */
async function handlePostCall(req: Request, res: Response) {
  const apiCallParam = verifyApiCallParamWithResp(req, res);
  if (apiCallParam === null) return;

  const verifyResult = await verifyBlockchainTxnWithResp(apiCallParam, res);
  if (verifyResult === null) return;

  const bridgeTxn = await createBridgeTxnWithResp(apiCallParam, res);
  if (bridgeTxn === null) return;
  log.APIS.handledPost(apiCallParam);

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
      from_addr: string;
      from_token: TokenId;
      to_addr: string;
      to_token: TokenId;
      amount: string;
      txn_id: string;
    };
    const apiCallParam = fullyParseApiParam(body);
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
 * @param apiCallParam - ApiCallParam
 * @param res - Express response
 * @returns
 */
async function verifyBlockchainTxnWithResp(
  apiCallParam: ApiCallParam,
  res: Response
): Promise<ConfirmOutcome.SUCCESS | null> {
  let verifyResult: ConfirmOutcome;
  try {
    verifyResult = await verifyBlockchainTxn(apiCallParam);
  } catch (err) {
    res.status(400).send('Invalid transaction');
    return null;
  }

  switch (verifyResult) {
    case ConfirmOutcome.SUCCESS:
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
    log.APIS.unknownError(err);
    // db error happened once when I push.
    //06:54:51Z error : (ERR_CODE: ANB301): Cannot query in database service: {"connected":true,"err":{"errno":-60,"code":"ETIMEDOUT","syscall":"read"},"query":"\n      SELECT * FROM anb_request WHERE db_id = $1;\n    ","params":{"0":57}}
    res.status(500).send('Internal server error.');
    return null;
  }
}
