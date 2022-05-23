import { ApiCallParam, parseApiCallParam } from '../utils/type';
import express, { Request, Response } from 'express';

import { BridgeTxnObject } from '../bridge';
import { TxnType } from '../blockchain';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';
import { stringifyBigintInObj } from '../utils/formatter';
import { transact } from '../bridge/transact';

export { algorandNear };

const algorandNear = express.Router();

algorandNear
  .route('/')
  .get((req: Request, res: Response) => {
    res.send('please use "POST" method.');
  })
  .post(async (req: Request, res: Response) => {
    let apiCallParam: ApiCallParam | undefined = undefined;

    try {
      const body = req.body as {
        type: TxnType;
        from: string;
        to: string;
        amount: string;
        txnId: string;
      };
      apiCallParam = parseApiCallParam(body);
    } catch (err) {
      res.status(406).send('Wrong POST body');
      res.end();
      logger.info('API server still running...');
      return;
    }

    // VERIFY API CALL PARAM
    // TODO: verify within both ram and db.

    // TRANSACT
    try {
      await transactWithResp(apiCallParam, res);
    } catch (err) {
      logger.error(err);
      res.status(40).send('Internal server error.');
      res.end();
      logger.info('API server still running...');
      return;
    }
  });

async function transactWithResp(apiCallParam: ApiCallParam, res: Response) {
  /* CONFIG */
  let bridgeTxnObject: BridgeTxnObject;
  const _literals =
    apiCallParam.type === TxnType.MINT
      ? { START: literals.START_MINTING, DONE: literals.DONE_MINT }
      : { START: literals.START_BURNING, DONE: literals.DONE_BURN };
  logger.info(
    _literals.START(apiCallParam.amount, apiCallParam.from, apiCallParam.to) +
      `txnId: ${apiCallParam.txnId}`
  );

  try {
    bridgeTxnObject = await transact(apiCallParam);
    logger.info(_literals.DONE);
    // TODO: use different literal template than transact
  } catch (err) {
    res.status(400).send('Missing required query params');
    res.end();
    throw err;
  }
  const stringifiedBridgeTxnObject = stringifyBigintInObj(bridgeTxnObject);
  logger.info(
    'API call ended, returned:\n' + JSON.stringify(stringifiedBridgeTxnObject)
  );
  return res.json(stringifiedBridgeTxnObject);
}
