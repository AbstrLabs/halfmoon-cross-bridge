export { startServer };

import {
  BurnApiParam,
  parseBurnApiParam,
  parseMintApiParam,
} from './utils/type';
import express, { Request, Response } from 'express';

import { BlockchainName } from '.';
import { BridgeTxnObject } from './bridge';
import { ENV } from './utils/dotenv';
import { burn } from './bridge/burn';
import { ensureString } from './utils/helper';
import { literals } from './utils/literals';
import { logger } from './utils/logger';
import { mint } from './bridge/mint';
import { verifyBlockchainTxn } from './blockchain/verify';

async function homePageTest() {
  /* Used once code */
}

function startServer() {
  /* route */
  const app = express();
  const apiRouter = express.Router();

  apiRouter.route('/mint').post(async (req: Request, res: Response) => {
    // res.json(req.body);
    const [from, to, amount, txnId] = [
      ensureString(req.body['mint_from']),
      ensureString(req.body['mint_to']),
      `${req.body['mint_amount']}`,
      ensureString(req.body['mint_txnId']),
    ];
    await mintResp({ from, to, amount, txnId }, res);
  });

  apiRouter.route('/burn').post(async (req: Request, res: Response) => {
    // res.json(req.body);
    const [from, to, amount, txnId] = [
      ensureString(req.body['mint_from']),
      ensureString(req.body['mint_to']),
      `${req.body['mint_amount']}`,
      ensureString(req.body['mint_txnId']),
    ];
    await burnResp({ from, to, amount, txnId }, res);
  });

  apiRouter
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
          from,
          to,
          amount,
          txnId,
        },
        BlockchainName.ALGO
      );
      res.send(`Verification result: ${verifyResult}`);
    });

  apiRouter.route('/near/verify').post(async (req: Request, res: Response) => {
    const [from, to, amount, txnId] = [
      ensureString(req.body['mint_from']),
      ensureString(req.body['mint_to']),
      `${req.body['mint_amount']}`,
      ensureString(req.body['mint_txnId']),
    ];
    const verifyResult = await verifyBlockchainTxn(
      {
        from,
        to,
        amount,
        txnId,
      },
      BlockchainName.NEAR
    );
    res.send(`Verification result: ${verifyResult}`);
  });

  app.get('/', async (req: Request, res: Response) => {
    if (
      process.env.TS_NODE_DEV === undefined ||
      process.env.TS_NODE_DEV === 'development'
    ) {
      await homePageTest();
    }
    res.sendFile('example-frontend.html', { root: __dirname });
  });

  /* Express setup */
  app.use(express.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
  app.use(express.json()); // parse application/json

  app.use('/api', apiRouter);
  app.listen(ENV.PORT, () => {
    logger.info(
      `Application started on port ${ENV.PORT}! http://localhost:${ENV.PORT}/`
    );
  });
}

/* server-side function wrap */

// TODO: 2-func: ref mintResp and burnResp since they are in same structure.
async function mintResp(apiCallParam: BurnApiParam, res: Response) {
  /* CONFIG */
  const mintApiParam = parseMintApiParam(apiCallParam);
  const { from, to, amount, txnId } = mintApiParam;
  let bridgeTxnObject: BridgeTxnObject;
  logger.info(literals.START_MINTING(amount, from, to));
  res.write(
    `${literals.START_MINTING(amount, from, to)}\n` +
      `${literals.MINT_NEAR_TXN_ID(txnId)}\n` +
      `${literals.MINT_AWAITING}\n`
  );
  try {
    bridgeTxnObject = await mint(mintApiParam);
    logger.info(literals.DONE_MINT);
    res.end();
  } catch (err) {
    res.status(400).send('Missing required query params');
    res.end();
    throw err;
  }
  return bridgeTxnObject;
}

// TODO: 2-func: ref mintResp and burnResp since they are in same structure.
async function burnResp(apiCallParam: BurnApiParam, res: Response) {
  /* CONFIG */
  const burnApiParam = parseBurnApiParam(apiCallParam);
  const { from, to, amount, txnId } = burnApiParam;
  let bridgeTxnObject: BridgeTxnObject;
  logger.info(literals.START_BURNING(amount, from, to));
  res.write(
    `${literals.START_BURNING(amount, from, to)}\n` +
      `${literals.BURN_ALGO_TXN_ID(txnId)}\n` +
      `${literals.BURN_AWAITING}\n`
  );
  res.end();
  try {
    bridgeTxnObject = await burn(burnApiParam);
    logger.info(literals.DONE_BURN);
  } catch (err) {
    res.status(400).send('Missing required query params');
    res.end();
    throw err;
  }
  return bridgeTxnObject;
}

// const apiCallParam: ApiCallParam;
