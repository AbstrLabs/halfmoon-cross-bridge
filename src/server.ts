export { startServer };

import express, { Request, Response } from 'express';

import { ENV } from './utils/dotenv';
import { type MintApiParam } from './';
import { ensureString } from './utils/helper';
import { literal } from './utils/literal';
import { logger } from './utils/logger';
import { mint } from './blockchain/bridge/mint-handler';

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
      const [from, to, amount, txId] = [
        ensureString(req.query.from),
        ensureString(req.query.to),
        ensureString(req.query.amount),
        ensureString(req.query.txId),
      ];
      await mintResp({ from, to, amount, txId }, res);
    })
    .post(async (req: Request, res: Response) => {
      // res.json(req.body);
      const [from, to, amount, txId] = [
        ensureString(req.body['mint_from']),
        ensureString(req.body['mint_to']),
        `${req.body['mint_amount']}`,
        ensureString(req.body['mint_txId']),
      ];
      await mintResp({ from, to, amount, txId }, res);
    });

  /* burn */
  // app
  //   .get('/api/burn', (req: Request, res: Response) => {
  //     if (!req.query.amount || !req.query.to || !req.query.from) {
  //       return res.status(400).send('Missing required query params');
  //     }
  //     // TODO: burn logic
  //     res.send(
  //       `Burning ${req.query.amount} goNEAR from ${req.query.from}(ALGO) to ${req.query.to}(NEAR)`
  //     );
  //   })
  //   .post('/api/burn', (req: Request, res: Response) => {});

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

async function mintResp(apiCallParam: MintApiParam, res: Response) {
  /* CONFIG */
  const mintApiParam = apiCallParam;
  const { from, to, amount, txId } = mintApiParam;
  var bridgeTxnInfo = undefined; // TODO
  logger.info(literal.START_MINTING(amount, from, to));
  res.write(`${literal.START_MINTING(amount, from, to)}\n`);
  res.write(`${literal.MINT_NEAR_TX_ID(txId)}\n`);
  res.write(`${literal.MINT_AWAITING}\n`);
  try {
    mint(mintApiParam);
    logger.info(literal.DONE_MINT);
    res.end();
  } catch (e) {
    res.status(400).send('Missing required query params');
  }
  return bridgeTxnInfo;
}
