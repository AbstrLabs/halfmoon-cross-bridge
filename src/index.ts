import { Request, Response } from 'express';

import express from 'express';
import { mint } from './txn/mint_handler';

/* helper */
function ensure_string(value: any): string {
  if (typeof value !== 'string') {
    throw new Error('value is not string type');
  }
  return value as string;
}

/* route */
const app = express();
const apiRouter = express.Router();

function mint_show_result(
  // TODO: Should use a page - logger.
  from: string,
  to: string,
  amount: number,
  res: Response
): void {
  try {
    for (let mintResult of mint(from, to, amount, 'fake_hash')) {
      res.write(mintResult);
      res.write('\n');
    }
    res.end();
  } catch (e) {
    res.status(400).send('Missing required query params');
  }
}

apiRouter
  .route('/mint')
  .get((req: Request, res: Response) => {
    const [from, to, amount] = [
      ensure_string(req.query.from),
      ensure_string(req.query.to),
      parseFloat(ensure_string(req.query.amount)),
    ];
    mint_show_result(from, to, amount, res);
  })
  .post((req: Request, res: Response) => {
    // res.json(req.body);
    const [from, to, amount] = [
      ensure_string(req.body['mint_from']),
      ensure_string(req.body['mint_to']),
      req.body['mint_amount'],
    ];
    mint_show_result(from, to, amount, res);
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

// app.get('/', (req: Request, res: Response) => {
//   res.sendFile('example-frontend.html', { root: __dirname });
// });

/* Express setup */
app.use(express.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(express.json()); // parse application/json

app.use('/api', apiRouter);
app.listen(3000, () => {
  console.log('Application started on port 3000! http://localhost:3000/');
});
