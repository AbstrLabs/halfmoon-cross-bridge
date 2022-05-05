export { startServer };

import express, { Request, Response } from 'express';

import { ENV } from './utils/dotenv';
import { type MintApiParam as BurnApiParam } from './';
import { ensureString } from './utils/helper';
import { literal } from './utils/literal';
import { logger } from './utils/logger';
import { mint } from './blockchain/bridge/mint';
import { BridgeTxnInfo } from './blockchain/bridge';
import { parseBurnApiParam, parseMintApiParam } from './utils/formatter';
import { burn } from './blockchain/bridge/burn';

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
      // TODO: use TS version
      process.env.NODE_ENV === undefined ||
      process.env.NODE_ENV === 'development'
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
  let bridgeTxnInfo: BridgeTxnInfo;
  logger.info(literal.START_MINTING(amount, from, to));
  res.write(`${literal.START_MINTING(amount, from, to)}\n`);
  res.write(`${literal.MINT_NEAR_TX_ID(txnId)}\n`);
  res.write(`${literal.MINT_AWAITING}\n`);
  try {
    bridgeTxnInfo = await mint(mintApiParam);
    logger.info(literal.DONE_MINT);
    res.end();
  } catch (e) {
    res.status(400).send('Missing required query params');
    res.end();
    throw e;
  }
  return bridgeTxnInfo;
}

// TODO: 2-func: ref mintResp and burnResp since they are in same structure.
async function burnResp(apiCallParam: BurnApiParam, res: Response) {
  /* CONFIG */
  const burnApiParam = parseBurnApiParam(apiCallParam);
  const { from, to, amount, txnId } = burnApiParam;
  let bridgeTxnInfo: BridgeTxnInfo;
  logger.info(literal.START_BURNING(amount, from, to));
  res.write(`${literal.START_BURNING(amount, from, to)}\n`);
  res.write(`${literal.BURN_ALGO_TX_ID(txnId)}\n`);
  res.write(`${literal.BURN_AWAITING}\n`);
  try {
    bridgeTxnInfo = await burn(burnApiParam);
    logger.info(literal.DONE_BURN);
    res.end();
  } catch (e) {
    res.status(400).send('Missing required query params');
    res.end();
    throw e;
  }
  return bridgeTxnInfo;
}
