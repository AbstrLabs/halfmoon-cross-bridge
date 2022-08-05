// TODO: CORS '*'

import express, { Request, Response } from 'express';
import cors from 'cors';

import { ENV } from '../utils/env';
import { txnRoute } from './routes/txn';
import { docsRoute } from './routes/docs';
import { statusRoute } from './routes/status';
import { log } from '../utils/log/log-template';

export const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
app.use(express.json()); // parse application/json

app.use('/', txnRoute);
app.use('/docs', docsRoute);
app.use('/status', statusRoute);
app.use('/', (_req: Request, res: Response) => {
  return res.status(404).end('404 Not found');
});

app.listen(ENV.PORT, () => {
  log.APIS.appStarted(ENV.PORT);
});

