import { ApiCallParam, parseApiCallParam } from '../utils/type';
import { ConfirmOutcome, TxnType } from '../blockchain';
import express, { Request, Response } from 'express';

import { BlockchainName } from '..';
import { BridgeTxnObject } from '../bridge';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';
import { stringifyBigintInObj } from '../utils/formatter';
import { transact } from '../bridge/transact';
import { verifyBlockchainTxn } from '../blockchain/verify';

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
      res.end();
      logger.info('API server still running...');
      return;
    }
    switch (verifyResult) {
      case ConfirmOutcome.SUCCESS:
        logger.info('Verify success');
        break;
      case ConfirmOutcome.WRONG_INFO:
        res.status(406).send('Invalid transaction');
        res.end();
        logger.info('API server still running...');
        return;
      case ConfirmOutcome.TIMEOUT:
        res.status(500).send('Verify transaction time out');
        res.end();
        logger.info('API server still running...');
        return;
      default:
        res.status(500).send('Server error code ANB-001');
        return;
    }
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
