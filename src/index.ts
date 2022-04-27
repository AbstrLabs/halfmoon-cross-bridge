import { Request, Response } from 'express';

import { ensureString } from './utils/helper';
import express from 'express';
import { init_near_acc } from './txn/init';
import { loadDotEnv } from './utils/dotenv';
import { mint } from './txn/mint_handler';

loadDotEnv();

/* route */
const app = express();
const apiRouter = express.Router();

function mintResp(
  // TODO: Should use a page - logger.
  from: string,
  to: string,
  amount: number,
  res: Response
): void {
  try {
    mint(from, to, amount, 'fake_hash');
    res.write(`Mint ${amount} NEAR from [${from}](NEAR) to [${to}](ALGO).\n`);
    res.write(`Will redirect to "history" after transaction confirmed. \n`);
    res.end();
  } catch (e) {
    res.status(400).send('Missing required query params');
  }
}

apiRouter
  .route('/mint')
  .get((req: Request, res: Response) => {
    const [from, to, amount] = [
      ensureString(req.query.from),
      ensureString(req.query.to),
      parseFloat(ensureString(req.query.amount)),
    ];
    mintResp(from, to, amount, res);
  })
  .post((req: Request, res: Response) => {
    // res.json(req.body);
    const [from, to, amount] = [
      ensureString(req.body['mint_from']),
      ensureString(req.body['mint_to']),
      req.body['mint_amount'],
    ];
    mintResp(from, to, amount, res);
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
function test() {
  init_near_acc();
}
app.get('/', (req: Request, res: Response) => {
  test();
  res.sendFile('example-frontend.html', { root: __dirname });
});

/* Express setup */
app.use(express.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(express.json()); // parse application/json

app.use('/api', apiRouter);
app.listen(process.env.PORT, () => {
  console.log(
    `Application started on port ${process.env.PORT}! http://localhost:${process.env.PORT}/`
  );
});
