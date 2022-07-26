export { docsRoute };
import express, { NextFunction, Request, Response } from 'express';
import { NodeEnvEnum } from '../..';
import { ENV } from '../../utils/dotenv';

const docsRoute = express.Router();

docsRoute
  .route('/docs')
  .get((req: Request, res: Response, next: NextFunction) => {
    if (ENV.NODE_ENV !== NodeEnvEnum.DEVELOPMENT) {
      res.status(404).send('Not found');
    }
    next();
  });

docsRoute.use('/docs', express.static(`${__dirname}/../../../TSDoc`));

// docsRoute.use('/docs', express.static(`${__dirname}/../../TSDoc`));
