export { startServer };

import {
  BurnApiParam,
  Stringer,
  parseBurnApiParam,
  parseMintApiParam,
} from './utils/type';
import express, { NextFunction, Request, Response } from 'express';

import { BlockchainName } from '.';
import { BridgeTxnObject } from './bridge';
import { ENV } from './utils/dotenv';
import { RequestOptions } from 'https';
import { burn } from './bridge/burn';
import { ensureString } from './utils/helper';
import { literals } from './utils/literals';
import { logger } from './utils/logger';
import { mint } from './bridge/mint';
import { renderFile } from 'ejs';
import { request } from 'http';
import { stringifyBigintInObj } from './utils/formatter';
import { verifyBlockchainTxn } from './blockchain/verify';

async function homePageTest() {
  /* Used once code */
}

function startServer() {
  /* route */
  const app = express();

  app.engine('html', renderFile);

  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*'); // TODO: safety check '*'
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
  });

  app.get('/', async (req: Request, res: Response) => {
    if (
      process.env.TS_NODE_DEV === undefined ||
      process.env.TS_NODE_DEV === 'development'
    ) {
      await homePageTest();
    }
    res.redirect('/frontend');
    // res.sendFile('./frontend/index.html', { root: __dirname });
  });

  // TODO: exclude `frontend/processing.html`, `frontend/success.html`

  app.use('/frontend', (req: Request, res: Response, next: NextFunction) => {
    if (['processing.html', 'success.html'].includes(req.url)) {
      return res.status(403).end('403 Forbidden');
    }
    next();
  });
  app.get('/frontend/result', (req: Request, res: Response) => {
    responseWithSuccess(res, req.query.bridgeTxnStr as string);
  });
  app.use('/frontend', express.static(__dirname + '/frontend'));

  /* Express setup */
  app.use(express.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
  app.use(express.json()); // parse application/json

  app.use('/redirect', (req: Request, res: Response) => {
    // TODO: improve next line
    const oldUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    // from https://stackoverflow.com/questions/66748591/hey-can-you-help-me-out-my-url-parse-is-deprecated

    enum RedirectPath {
      MINT = '/api/mint',
      BURN = '/api/burn',
    }
    const newPath: RedirectPath = req.query.path as RedirectPath;
    if (newPath === undefined) {
      return res.status(400).send('Missing required query params "type"');
    }
    let newParam: Record<string, Stringer>;
    let txnTypeStr: string;
    if (!Object.values(RedirectPath).includes(newPath)) {
      return res.status(400).send('Wrong query params "path"');
    } else {
      switch (newPath) {
        case RedirectPath.MINT:
          newParam = {
            mint_from: ensureString(req.query.mint_from),
            mint_to: ensureString(req.query.mint_to),
            mint_amount: ensureString(req.query.mint_amount),
            mint_txnId: ensureString(req.query.transactionHashes),
          };
          txnTypeStr = 'Mint';
          break;
        case RedirectPath.BURN:
          newParam = {
            burn_from: ensureString(req.query.burn_from),
            burn_to: ensureString(req.query.burn_to),
            burn_amount: ensureString(req.query.burn_amount),
            burn_txnId: ensureString(req.query.burn_txnId),
          };
          txnTypeStr = 'Burn';
          break;
        default:
          // will never happen, only for typing
          newParam = {};
          txnTypeStr = '';
          break;
      }
    }

    const newUrl = new URL(newPath, oldUrl);
    for (const key in newParam) {
      newUrl.searchParams.append(
        key,
        encodeURIComponent(newParam[key].toString())
      );
    }
    const newUrlStr = newUrl.toString();

    res.render(__dirname + '/frontend/processing.html', {
      toUrl: newUrlStr,
      params: JSON.stringify(newParam),
      txnTypeStr,
    });
    // res.redirect(newStr);
  });

  // TODO: move API to a new file of new folder server/api
  const apiRouter = express.Router();

  apiRouter
    .route('/mint')
    .get(async (req: Request, res: Response) => {
      const postParam = {
        mint_from: req.query.mint_from,
        mint_to: req.query.mint_to,
        mint_amount: req.query.mint_amount,
        mint_txnId: req.query.mint_txnId,
      };
      const requestOption: RequestOptions = {
        hostname: req.hostname,
        port: Number(ENV.PORT),
        path: '/api/mint',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(postParam)),
        },
      };
      const apiReq = request(requestOption, (apiRes) => {
        let body = '';
        apiRes.on('data', function (chunk) {
          body += chunk; // will parse chunk as string
        });
        apiRes.on('end', () => {
          const apiResBodyStr = body;
          return res.redirect(
            '/frontend/result/?bridgeTxnStr=' + apiResBodyStr
          );

          //  return responseWithSuccess(res, apiResBodyStr);
        });
      });
      apiReq.write(
        JSON.stringify(postParam),
        (error: Error | null | undefined) => {
          if (error) {
            console.log('got an error writing the request');
            console.log(error);
            return res.send(JSON.stringify(error));
          }
          // return res.send('mint success');
        }
      );
      apiReq.on('error', (error: Error) => {
        console.log('got an error');
        console.log(error);
        return res.write(JSON.stringify(error));
      });

      // mint dont
    })
    .post(async (req: Request, res: Response) => {
      // res.json(req.body);
      const [from, to, amount, txnId] = [
        ensureString(req.body['mint_from']),
        ensureString(req.body['mint_to']),
        `${req.body['mint_amount']}`,
        ensureString(req.body['mint_txnId']),
      ];
      await mintResp({ from, to, amount, txnId }, res);
    });

  apiRouter
    .route('/burn')
    .get(async (req: Request, res: Response) => {
      const postParam = {
        burn_from: req.query.burn_from,
        burn_to: req.query.burn_to,
        burn_amount: req.query.burn_amount,
        burn_txnId: req.query.burn_txnId,
      };
      const requestOption: RequestOptions = {
        hostname: req.hostname,
        port: Number(ENV.PORT),
        path: '/api/burn',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(postParam)),
        },
      };

      const apiReq = request(requestOption, (apiRes) => {
        let body = '';
        apiRes.on('data', function (chunk) {
          body += chunk; // will parse chunk as string
        });

        apiRes.on('end', () => {
          const apiResBodyStr = body;
          return res.redirect(
            '/frontend/result/?bridgeTxnStr=' + apiResBodyStr
          );
          // return responseWithSuccess(res, apiResBodyStr);
        });
      });
      apiReq.write(
        JSON.stringify(postParam),
        (error: Error | null | undefined) => {
          if (error) {
            console.log('got an error writing the request');
            console.log(error);
            return res.send(JSON.stringify(error));
          }
        }
      );
      apiReq.on('error', (error: Error) => {
        console.log('got an error');
        console.log(error);
        return res.write(JSON.stringify(error));
      });
    })
    .post(async (req: Request, res: Response) => {
      // res.json(req.body);
      const [from, to, amount, txnId] = [
        ensureString(req.body['burn_from']),
        ensureString(req.body['burn_to']),
        `${req.body['burn_amount']}`,
        ensureString(req.body['burn_txnId']),
      ];
      await burnResp({ from, to, amount, txnId }, res);
    });

  apiRouter
    .route('/algorand/verify')
    .post(async (req: Request, res: Response) => {
      const [from, to, amount, txnId] = [
        ensureString(req.body['mint_from']),
        ensureString(req.body['mint_to']),
        `${req.body['mint_amount']}`,
        ensureString(req.body['mint_txnId']),
      ];
      const verifyResult = await verifyBlockchainTxn(
        {
          from,
          to,
          amount,
          txnId,
        },
        BlockchainName.ALGO
      );
      res.send(`Verification result: ${verifyResult}`);
    });

  apiRouter.route('/near/verify').post(async (req: Request, res: Response) => {
    const [from, to, amount, txnId] = [
      ensureString(req.body['mint_from']),
      ensureString(req.body['mint_to']),
      `${req.body['mint_amount']}`,
      ensureString(req.body['mint_txnId']),
    ];
    const verifyResult = await verifyBlockchainTxn(
      {
        from,
        to,
        amount,
        txnId,
      },
      BlockchainName.NEAR
    );
    res.send(`Verification result: ${verifyResult}`);
  });
  app.use('/api', apiRouter);
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

// TODO: 2-func: ref mintResp and burnResp since they are in same structure.
async function mintResp(apiCallParam: BurnApiParam, res: Response) {
  /* CONFIG */
  const mintApiParam = parseMintApiParam(apiCallParam);
  const { from, to, amount, txnId } = mintApiParam;
  let bridgeTxnObject: BridgeTxnObject;
  logger.info(literals.START_MINTING(amount, from, to) + `txnId: ${txnId}`);
  // res.write(
  //   `${literals.START_MINTING(amount, from, to)}\n` +
  //     `${literals.MINT_NEAR_TXN_ID(txnId)}\n` +
  //     `${literals.MINT_AWAITING}\n`
  // );
  try {
    bridgeTxnObject = await mint(mintApiParam);
    // logger.info(literals.DONE_MINT);
    // TODO: use different literal template
  } catch (err) {
    res.status(400).send('Missing required query params');
    res.end();
    throw err;
  }

  return res.json(stringifyBigintInObj(bridgeTxnObject));
}

// TODO: 2-func: ref mintResp and burnResp since they are in same structure.
async function burnResp(apiCallParam: BurnApiParam, res: Response) {
  /* CONFIG */
  const burnApiParam = parseBurnApiParam(apiCallParam);
  const { from, to, amount, txnId } = burnApiParam;
  let bridgeTxnObject: BridgeTxnObject;
  logger.info(literals.START_BURNING(amount, from, to) + `txnId: ${txnId}`);
  // res.write(
  //   `${literals.START_BURNING(amount, from, to)}\n` +
  //     `${literals.BURN_ALGO_TXN_ID(txnId)}\n` +
  //     `${literals.BURN_AWAITING}\n`
  // );
  // res.end();
  try {
    bridgeTxnObject = await burn(burnApiParam);
    logger.info(literals.DONE_BURN);
  } catch (err) {
    res.status(400).send('Missing required query params');
    res.end();
    throw err;
  }
  return res.json(stringifyBigintInObj(bridgeTxnObject));
}

function responseWithSuccess(res: Response, bridgeTxnStr: string) {
  res.render(__dirname + '/frontend/success.html', {
    bridgeTxnStr,
  });
}
