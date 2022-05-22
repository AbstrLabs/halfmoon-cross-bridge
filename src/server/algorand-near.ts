import {
  BurnApiParam,
  MintApiParam,
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

algorandNear.route('/mint').post(async (req: Request, res: Response) => {
  // res.json(req.body);
  const [from, to, amount, txnId] = [
    ensureString(req.body['mint_from']),
    ensureString(req.body['mint_to']),
    `${req.body['mint_amount']}`,
    ensureString(req.body['mint_txnId']),
  ];
  await mintResp({ txnType: TxnType.MINT, from, to, amount, txnId }, res);
});

algorandNear.route('/burn').post(async (req: Request, res: Response) => {
  // res.json(req.body);
  const [from, to, amount, txnId] = [
    ensureString(req.body['burn_from']),
    ensureString(req.body['burn_to']),
    `${req.body['burn_amount']}`,
    ensureString(req.body['burn_txnId']),
  ];
  await burnResp({ txnType: TxnType.BURN, from, to, amount, txnId }, res);
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

// TODO: 2-func: ref mintResp and burnResp since they are in same structure.
async function mintResp(apiCallParam: MintApiParam, res: Response) {
  /* CONFIG */
  const mintApiParam = parseMintApiParam(apiCallParam);
  const { from, to, amount, txnId } = mintApiParam;
  let bridgeTxnObject: BridgeTxnObject;
  logger.info(literals.START_MINTING(amount, from, to) + `txnId: ${txnId}`);
  try {
    bridgeTxnObject = await transact(mintApiParam);
    logger.info(literals.DONE_MINT);
    // TODO: use different literal template
  } catch (err) {
    res.status(400).send('Missing required query params');
    res.end();
    throw err;
  }

  return res.json(stringifyBigintInObj(bridgeTxnObject));
}

// TODO: 2-func: ref mintResp and burnResp since they are in same structure.
async function burnResp(apiCallParam: BurnApiParam, res: Response) {
  /* CONFIG */
  const burnApiParam = parseBurnApiParam(apiCallParam);
  const { from, to, amount, txnId } = burnApiParam;
  let bridgeTxnObject: BridgeTxnObject;
  logger.info(literals.START_BURNING(amount, from, to) + `txnId: ${txnId}`);
  // res.end();
  try {
    bridgeTxnObject = await transact(burnApiParam);
    logger.info(literals.DONE_BURN);
  } catch (err) {
    res.status(400).send('Missing required query params');
    res.end();
    throw err;
  }
  return res.json(stringifyBigintInObj(bridgeTxnObject));
}
