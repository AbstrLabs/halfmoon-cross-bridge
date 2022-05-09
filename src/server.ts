export { startServer };

import {
  BurnApiParam,
  parseBurnApiParam,
  parseMintApiParam,
} from './utils/type';
import express, { Request, Response } from 'express';

import { BridgeTxn } from './blockchain/bridge';
import { ENV } from './utils/dotenv';
import { burn } from './blockchain/bridge/burn';
import { ensureString } from './utils/helper';
import { literals } from './utils/literals';
import { logger } from './utils/logger';
import { mint } from './blockchain/bridge/mint';

async function homePageTest() {
  /* Used once code */
}

function startServer() {
  /* route */
  const app = express();
  const apiRouter = express.Router();

  apiRouter
    .route('/mint')
    .get(async (req: Request, res: Response) => {
      const [from, to, amount, txnId] = [
        ensureString(req.query.from),
        ensureString(req.query.to),
        ensureString(req.query.amount),
        ensureString(req.query.txnId),
      ];
      await mintResp({ from, to, amount, txnId }, res);
    })
    .post(async (req: Request, res: Response) => {
      // res.json(req.body);
      const [from, to, amount, txnId] = [
        ensureString(req.body['mint_from']),
        ensureString(req.body['mint_to']),
        `${req.body['mint_amount']}`,
        ensureString(req.body['mint_txnId']),
      ];
      await mintResp({ from, to, amount, txnId: txnId }, res);
    });

  apiRouter
    .route('/burn')
    .get(async (req: Request, res: Response) => {
      const [from, to, amount, txnId] = [
        ensureString(req.query.from),
        ensureString(req.query.to),
        ensureString(req.query.amount),
        ensureString(req.query.txnId),
      ];
      await burnResp({ from, to, amount, txnId }, res);
    })
    .post(async (req: Request, res: Response) => {
      // res.json(req.body);
      const [from, to, amount, txnId] = [
        ensureString(req.body['mint_from']),
        ensureString(req.body['mint_to']),
        `${req.body['mint_amount']}`,
        ensureString(req.body['mint_txnId']),
      ];
      await burnResp({ from, to, amount, txnId: txnId }, res);
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
  let bridgeTxn: BridgeTxn;
  logger.info(literals.START_MINTING(amount, from, to));
  res.write(`${literals.START_MINTING(amount, from, to)}\n`);
  res.write(`${literals.MINT_NEAR_TXN_ID(txnId)}\n`);
  res.write(`${literals.MINT_AWAITING}\n`);
  try {
    bridgeTxn = await mint(mintApiParam);
    logger.info(literals.DONE_MINT);
    res.end();
  } catch (e) {
    res.status(400).send('Missing required query params');
    res.end();
    throw e;
  }
  return bridgeTxn;
}

// TODO: 2-func: ref mintResp and burnResp since they are in same structure.
async function burnResp(apiCallParam: BurnApiParam, res: Response) {
  /* CONFIG */
  const burnApiParam = parseBurnApiParam(apiCallParam);
  const { from, to, amount, txnId } = burnApiParam;
  let bridgeTxn: BridgeTxn;
  logger.info(literals.START_BURNING(amount, from, to));
  res.write(`${literals.START_BURNING(amount, from, to)}\n`);
  res.write(`${literals.BURN_ALGO_TXN_ID(txnId)}\n`);
  res.write(`${literals.BURN_AWAITING}\n`);
  try {
    bridgeTxn = await burn(burnApiParam);
    logger.info(literals.DONE_BURN);
    res.end();
  } catch (e) {
    res.status(400).send('Missing required query params');
    res.end();
    throw e;
  }
  return bridgeTxn;
}
