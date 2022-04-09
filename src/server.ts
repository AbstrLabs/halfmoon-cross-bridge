export { startServer };

import express, { Request, Response } from 'express';

import { mint } from './blockchain/mint_handler';
import { ENV, loadDotEnv } from './utils/dotenv';
import { ensureString } from './utils/helper';
import { type BridgeTxnParam } from '.';

async function test() {}

function startServer() {
  loadDotEnv();

  /* route */
  const app = express();
  const apiRouter = express.Router();

  apiRouter
    .route('/mint')
    .get((req: Request, res: Response) => {
      const [from, to, amount, txId] = [
        ensureString(req.query.from),
        ensureString(req.query.to),
        ensureString(req.query.amount),
        ensureString(req.query.txId),
      ];
      const bridgeTxnParam: BridgeTxnParam = { from, to, amount, txId };
      mintResp(bridgeTxnParam, res);
    })
    .post((req: Request, res: Response) => {
      // res.json(req.body);
      const [from, to, amount, txId] = [
        ensureString(req.body['mint_from']),
        ensureString(req.body['mint_to']),
        `${req.body['mint_amount']}`,
        ensureString(req.body['mint_txId']),
      ];
      const bridgeTxnParam: BridgeTxnParam = { from, to, amount, txId };
      mintResp(bridgeTxnParam, res);
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
    if (process.env.NODE_ENV === 'development') await test();
    res.sendFile('example-frontend.html', { root: __dirname });
  });

  /* Express setup */
  app.use(express.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
  app.use(express.json()); // parse application/json

  app.use('/api', apiRouter);
  app.listen(ENV.PORT, () => {
    console.log(
      `Application started on port ${ENV.PORT}! http://localhost:${ENV.PORT}/`
    );
  });
}

/* server-side function wrap */

function mintResp(bridgeTxnParam: BridgeTxnParam, res: Response): void {
  const { from, to, amount, txId } = bridgeTxnParam;
  try {
    mint(bridgeTxnParam);
    res.write(`Mint ${amount} NEAR from [${from}](NEAR) to [${to}](ALGO).\n`);
    res.write(`Mint stake with transaction ID [${txId}](NEAR).\n`);
    res.write(`Will redirect to "history" after transaction finished. \n`);
    res.end();
  } catch (e) {
    res.status(400).send('Missing required query params');
  }
}
