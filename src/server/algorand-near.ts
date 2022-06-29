import { ApiCallParam, parseApiCallParam } from '../utils/type';
import { ConfirmOutcome, TxnType } from '../blockchain';
import express, { Request, Response } from 'express';

import { BlockchainName } from '..';
import { BridgeTxn, BridgeTxnObj } from '../bridge';
import { WELCOME_JSON } from '.';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';
import { stringifyBigintInObj } from '../utils/formatter';
import { create, _execute } from '../bridge/transact';
import { verifyBlockchainTxn } from '../blockchain/verify';

export { algorandNear };

const algorandNear = express.Router();

algorandNear
  .route('/')
  .get((req: Request, res: Response) => {
    res.json(WELCOME_JSON);
  })
  .post(async (req: Request, res: Response) => {
    await handleAlgorandNearApiCall(req, res);
  });

async function handleAlgorandNearApiCall(req: Request, res: Response) {
  const apiCallParam = verifyApiCallParamWithResp(req, res);
  if (apiCallParam === null) return;

  const verifyResult = await verifyBlockchainTxnWithResp(apiCallParam, res);
  if (verifyResult === null) return;

  const bridgeTxn = await createBridgeTxnWithResp(apiCallParam, res);
  if (bridgeTxn === null) return;

  logger.info('Handled API call: ' + JSON.stringify(apiCallParam));

  res.status(200).json({
    BridgeTxnStatus: bridgeTxn.txnStatus,
    uid: bridgeTxn.uid,
  });
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
      logger.verbose('verifyBlockchainTxnWithResp: passed');
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
    const bridgeTxn: BridgeTxn = await create(apiCallParam);
    return bridgeTxn;
  } catch (err) {
    logger.error('unknown error, maybe db?');
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
    const bridgeTxn = await create(apiCallParam);
    bridgeTxnObject = await _execute(bridgeTxn);
    logger.info(_literals.DONE);
    // TODO: use different literal template than transact
  } catch (err) {
    logger.error(err);
    res.status(406).send('Missing required query params');
    res.end();
    return;
  }
  const stringifiedBridgeTxnObject = stringifyBigintInObj(bridgeTxnObject);
  logger.info(
    'API call ended, returned:\n' + JSON.stringify(stringifiedBridgeTxnObject)
  );
  return res.json(stringifiedBridgeTxnObject);
}
