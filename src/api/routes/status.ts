import { Router, Request, Response } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-var-requires
const version = require('../../package.json').version as string;

const STATUS_JSON = {
  API_VERSION: version,
  API_SERVER: 'https://api.halfmooncross.com/',
};


export const statusRoute = Router().get('/', (_req: Request, res: Response) => {
  return res.json(STATUS_JSON);
});