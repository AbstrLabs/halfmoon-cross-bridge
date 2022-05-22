// TODO: CORS '*'
// TODO: feat: add a RAM pool

export { startServer };

import express, { Request, Response } from 'express';

import { ENV } from './utils/dotenv';
import { algorandNear } from './server/algorand-near';
import { logger } from './utils/logger';

async function homePageTest() {
  /* Used once code */
}

function startServer() {
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
    res.json({
      MESSAGE: 'Welcome to the Algorand-NEAR bridge API',
      FRONTEND: 'https://www.halfmooncross.com/',
      API_ENDPOINT: {
        URL: '/algorand-near',
        PARAMS: {
          from: 'string',
          to: 'string',
          amount: 'string',
          txnId: 'string',
          txnType: 'literal("MINT","BURN")',
        },
      },
    });
  });

  /* Express setup */
  app.use(express.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
  app.use(express.json()); // parse application/json

  // TODO: move API to a new file of new folder server/api

  app.use('/algorand-near', algorandNear);
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
