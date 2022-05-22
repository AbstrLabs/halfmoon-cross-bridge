import {
  ApiCallParam,
  parseBurnApiParam,
  parseMintApiParam,
} from '../utils/type';
import express, { Request, Response } from 'express';

import { BlockchainName } from '..';
import { BridgeTxnObject } from '../bridge';
import { TxnType } from '../blockchain';
import { ensureString } from '../utils/helper';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';
import { stringifyBigintInObj } from '../utils/formatter';
import { transact } from '../bridge/transact';
import { verifyBlockchainTxn } from '../blockchain/verify';

export { algorandNear };

const algorandNear = express.Router();

/**
 * @deprecated use new API endpoint.
 */
algorandNear.route('/mint').post(async (req: Request, res: Response) => {
  // res.json(req.body);
  const [from, to, amount, txnId] = [
    ensureString(req.body['mint_from']),
    ensureString(req.body['mint_to']),
    `${req.body['mint_amount']}`,
    ensureString(req.body['mint_txnId']),
  ];
  await transactWithResp(
    { txnType: TxnType.MINT, from, to, amount, txnId },
    res,
    { usingDeprecatedAPI: true }
  );
});

/**
 * @deprecated use new API endpoint.
 */
algorandNear.route('/burn').post(async (req: Request, res: Response) => {
  // res.json(req.body);
  const [from, to, amount, txnId] = [
    ensureString(req.body['burn_from']),
    ensureString(req.body['burn_to']),
    `${req.body['burn_amount']}`,
    ensureString(req.body['burn_txnId']),
  ];
  await transactWithResp(
    { txnType: TxnType.BURN, from, to, amount, txnId },
    res,
    { usingDeprecatedAPI: true }
  );
});

algorandNear
  .route('/')
  .get((req: Request, res: Response) => {
    res.send('please use "POST" method.');
  })
  .post(async (req: Request, res: Response) => {
    let apiCallParam: ApiCallParam;

    // PARSE API CALL PARAM
    try {
      // ref: use Array.map if more attributes are added.
      apiCallParam = {
        txnType: ensureString(req.body['type']) as TxnType,
        from: ensureString(req.body['from']),
        to: ensureString(req.body['to']),
        amount: ensureString(req.body['amount']),
        txnId: ensureString(req.body['txnId']),
      };
      // `${req.body['amount']}`, testing amount.

      // not mutating apiCallParam, only zod-parse.
      if (apiCallParam.txnType === TxnType.MINT) {
        apiCallParam = parseMintApiParam(apiCallParam);
      }
      if (apiCallParam.txnType === TxnType.BURN) {
        apiCallParam = parseBurnApiParam(apiCallParam);
      }
    } catch (err) {
      res.status(400).send('Wrong param type: all params should be string');
      res.end();
      throw err;
    }

    // VERIFY API CALL PARAM
    // verify within both ram and db.
    await transactWithResp(apiCallParam, res);
  });

// TODO: move verify to API.
algorandNear
  .route('/algorand/verify')
  .post(async (req: Request, res: Response) => {
    const [from, to, amount, txnId] = [
      ensureString(req.body['mint_from']),
      ensureString(req.body['mint_to']),
      `${req.body['mint_amount']}`,
      ensureString(req.body['mint_txnId']),
    ];
    const verifyResult = await verifyBlockchainTxn(
      {
        txnType: TxnType.BURN,
        from,
        to,
        amount,
        txnId,
      },
      BlockchainName.ALGO
    );
    res.send(`Verification result: ${verifyResult}`);
  });

algorandNear.route('/near/verify').post(async (req: Request, res: Response) => {
  const [from, to, amount, txnId] = [
    ensureString(req.body['mint_from']),
    ensureString(req.body['mint_to']),
    `${req.body['mint_amount']}`,
    ensureString(req.body['mint_txnId']),
  ];
  const verifyResult = await verifyBlockchainTxn(
    {
      txnType: TxnType.MINT,
      from,
      to,
      amount,
      txnId,
    },
    BlockchainName.NEAR
  );
  res.send(`Verification result: ${verifyResult}`);
});

async function transactWithResp(
  apiCallParam: ApiCallParam,
  res: Response,
  { usingDeprecatedAPI } = { usingDeprecatedAPI: false }
) {
  /* CONFIG */
  let bridgeTxnObject: BridgeTxnObject;

  // TODO: remove this part after deprecation.
  try {
    // not mutating apiCallParam, only zod-parse.
    if (apiCallParam.txnType === TxnType.MINT) {
      apiCallParam = parseMintApiParam(apiCallParam);
    }
    if (apiCallParam.txnType === TxnType.BURN) {
      apiCallParam = parseBurnApiParam(apiCallParam);
    }
  } catch (err) {
    res.status(400).send('Wrong query params');
    res.end();
    throw err;
  }
  // TODO: remove this part above after deprecation.

  const _literals =
    apiCallParam.txnType === TxnType.MINT
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
  if (usingDeprecatedAPI) {
    res.send(
      stringifyBigintInObj({ ...bridgeTxnObject, CAUTION: 'API_DEPRECATED' })
    );
  }
  return res.json(stringifyBigintInObj({ bridgeTxnObject }));
}
