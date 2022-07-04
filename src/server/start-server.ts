// TODO: CORS '*'
// TODO: feat: add a RAM pool

export { startApiServer };

import express, { Request, Response } from 'express';

import { ENV } from '../utils/dotenv';
import { WELCOME_JSON } from '.';
import { algorandNear } from './algorand-near';
import { logger } from '../utils/logger';

async function homePageTest() {
  /* Used once code */
}

function startApiServer() {
  const app = express();

  /* CORS */
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*'); // TODO: safety check '*'
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
  });

  /* API */
  app.get('/', (req: Request, res: Response) => {
    if (
      process.env.TS_NODE_DEV === undefined ||
      process.env.TS_NODE_DEV === 'development'
    ) {
      void homePageTest();
    }
    res.json(WELCOME_JSON);
  });

  /* Express setup */
  app.use(express.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
  app.use(express.json()); // parse application/json

  // TODO: move API to a new file of new folder server/api

  // is it better to write "/algorand-near" here or in "algorand-near.ts"?
  app.use('/', algorandNear);
  app.use('/', (req: Request, res: Response) => {
    return res.status(404).end('404 Not found');
  });

  app.listen(ENV.PORT, () => {
    logger.info(
      `Application started on port ${ENV.PORT}! http://localhost:${ENV.PORT}/`
    );
  });
}

/* server-side function wrap */
