/**
 * Route for /algorand-near with POST and GET method.
 *
 * @todo v0.3 change `/algorand-near` to `/txn`
 */
import { ConfirmOutcome } from '../../blockchain/abstract-base';
import express, { Request, Response, NextFunction } from 'express';

import { BridgeTxn } from '../../bridge';
import { verifyBlockchainTxn } from '../../blockchain/verify';
import { apiWorker } from '../api-worker';
import { db } from '../../database/db';
import { TokenId } from '../../common/src/type/token';
import { BridgeTxnStatusEnum } from '../../common/src/type/txn';
import { TXN_ROUTE_PATH } from '../../config';
import { log } from '../../utils/log/log-template';
import { DbId, DbItem, parseDbId } from '../../common/src/type/database';
import { TxnId } from '../../common/src/type/blockchain';
import { ApiCallParam, fullyParseApiParam } from '../../common/src/type/api';
import { parseTxnUid, TxnUid } from '../../common/src/type/cross-module';

export const txnRoute = express.Router();
txnRoute.route('/')
  .get(handleGetCall)
  .post(handlePostCall);

// TODO: refactor move to types with better typing
export interface PostReturn {
  BridgeTxnStatus: BridgeTxnStatusEnum;
  uid: TxnUid;
}

async function handleGetCall(req: Request, res: Response) {
  try {
    const uid = Number(req.query.uid);
    const dbItem: DbItem = await db.readTxn(uid);
    const safeObj = BridgeTxn.fromDbItem(dbItem).toSafeObject();
    return res.json(safeObj);
  } catch (err) {
    log.APIS.generalError(err);
    return res.status(400).json({msg: err});
  }
}

async function handlePostCall(req: Request, res: Response) {
  let apiCallParam;
  try {
    const body = req.body as {
      from_addr: string;
      from_token: TokenId;
      to_addr: string;
      to_token: TokenId;
      amount: string;
      txn_id: string;
    };
    apiCallParam = fullyParseApiParam(body);
  } catch (err) {
    res.status(400).json({msg: 'Wrong POST body'});
    return;
  }

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
