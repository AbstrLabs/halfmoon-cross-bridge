export { startServer };

import express, { Request, Response } from 'express';

import { mint } from './blockchain/bridge/mint-handler';
import { ENV, loadDotEnv } from './utils/dotenv';
import { ensureString } from './utils/helper';
import { type GenericTxInfo } from '.';
import { logger } from './utils/logger';

async function homePageTest() {
  /* Used once code */
}

function startServer() {
  loadDotEnv();

  /* route */
  const app = express();
  const apiRouter = express.Router();

  apiRouter
    .route('/mint')
    .get((req: Request, res: Response) => {
      // TODO: use things like 'joi' to validate. if we change this more
      const [from, to, amount, txId] = [
        ensureString(req.query.from),
        ensureString(req.query.to),
        ensureString(req.query.amount),
        ensureString(req.query.txId),
      ];
      const genericTxInfo: GenericTxInfo = { from, to, amount, txId };
      mintResp(genericTxInfo, res);
    })
    .post((req: Request, res: Response) => {
      // res.json(req.body);
      const [from, to, amount, txId] = [
        ensureString(req.body['mint_from']),
        ensureString(req.body['mint_to']),
        `${req.body['mint_amount']}`,
        ensureString(req.body['mint_txId']),
      ];
      const genericTxInfo: GenericTxInfo = { from, to, amount, txId };
      mintResp(genericTxInfo, res);
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

function mintResp(genericTxInfo: GenericTxInfo, res: Response): void {
  const { from, to, amount, txId } = genericTxInfo;
  try {
    mint(genericTxInfo);
    res.write(`Mint ${amount} NEAR from [${from}](NEAR) to [${to}](ALGO).\n`);
    res.write(`Mint stake with transaction ID [${txId}](NEAR).\n`);
    res.write(`Will redirect to "history" after transaction finished. \n`);
    res.end();
  } catch (e) {
    res.status(400).send('Missing required query params');
  }
}
