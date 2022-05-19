export { startServer };

import {
  BurnApiParam,
  Stringer,
  parseBurnApiParam,
  parseMintApiParam,
} from './utils/type';
import express, { Request, Response } from 'express';

import { BlockchainName } from '.';
import { BridgeTxnObject } from './bridge';
import { ENV } from './utils/dotenv';
import { burn } from './bridge/burn';
import { ensureString } from './utils/helper';
import { literals } from './utils/literals';
import { logger } from './utils/logger';
import { mint } from './bridge/mint';
import { verifyBlockchainTxn } from './blockchain/verify';

async function homePageTest() {
  /* Used once code */
}

function startServer() {
  /* route */
  const app = express();
  app.get('/', async (req: Request, res: Response) => {
    if (
      process.env.TS_NODE_DEV === undefined ||
      process.env.TS_NODE_DEV === 'development'
    ) {
      await homePageTest();
    }
    res.sendFile('./frontend/index.html', { root: __dirname });
  });
  app.use('/frontend', express.static(__dirname + '/frontend'));

  /* Express setup */
  app.use(express.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
  app.use(express.json()); // parse application/json

  app.use('/redirect', (req: Request, res: Response) => {
    // TODO: improve next line
    const oldUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    // from https://stackoverflow.com/questions/66748591/hey-can-you-help-me-out-my-url-parse-is-deprecated

    enum RedirectType {
      MINT = 'MINT',
      BURN = 'BURN',
    }
    res.json(req.query);
    const type = req.query.type as RedirectType;
    if (type === undefined) {
      return res.status(400).send('Missing required query params "type"');
    }
    // TODO: improve this newPath logic. Just read it from the query params then verify.
    let newPath: string;
    let newParam: Record<string, Stringer>;
    if (!(type in RedirectType)) {
      return res.status(400).send('Wrong query params "type"');
    } else {
      switch (type) {
        case RedirectType.MINT:
          newPath = '/api/mint';
          newParam = {
            mint_from: literals.NOT_LOADED_FROM_ENV_STR,
            mint_to: literals.NOT_LOADED_FROM_ENV_STR,
            mint_amount: literals.NOT_LOADED_FROM_ENV_STR,
            mint_txnId: ensureString(req.query.transactionHashes),
          };
          break;
        case RedirectType.BURN:
          newPath = '/api/burn';
          newParam = {
            burn_from: literals.NOT_LOADED_FROM_ENV_STR,
            burn_to: literals.NOT_LOADED_FROM_ENV_STR,
            burn_amount: literals.NOT_LOADED_FROM_ENV_STR,
            burn_txnId: ensureString(req.query.transactionHashes),
          };
          break;
        default:
          // will never happen, only for typing
          newPath = '/';
          newParam = {};
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
    newUrl.searchParams.set('txnId', 'a');
    const newStr = newUrl.toString();
    console.log('newStr : ', newStr); // DEV_LOG_TO_REMOVE

    // res.redirect(newStr);
  });

  // TODO: move API to a new file of new folder server/api
  const apiRouter = express.Router();

  apiRouter.route('/mint').post(async (req: Request, res: Response) => {
    // res.json(req.body);
    const [from, to, amount, txnId] = [
      ensureString(req.body['mint_from']),
      ensureString(req.body['mint_to']),
      `${req.body['mint_amount']}`,
      ensureString(req.body['mint_txnId']),
    ];
    await mintResp({ from, to, amount, txnId }, res);
  });

  apiRouter.route('/burn').post(async (req: Request, res: Response) => {
    // res.json(req.body);
    const [from, to, amount, txnId] = [
      ensureString(req.body['mint_from']),
      ensureString(req.body['mint_to']),
      `${req.body['mint_amount']}`,
      ensureString(req.body['mint_txnId']),
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
  logger.info(literals.START_MINTING(amount, from, to));
  res.write(
    `${literals.START_MINTING(amount, from, to)}\n` +
      `${literals.MINT_NEAR_TXN_ID(txnId)}\n` +
      `${literals.MINT_AWAITING}\n`
  );
  try {
    bridgeTxnObject = await mint(mintApiParam);
    logger.info(literals.DONE_MINT);
    res.end();
  } catch (err) {
    res.status(400).send('Missing required query params');
    res.end();
    throw err;
  }
  return bridgeTxnObject;
}

// TODO: 2-func: ref mintResp and burnResp since they are in same structure.
async function burnResp(apiCallParam: BurnApiParam, res: Response) {
  /* CONFIG */
  const burnApiParam = parseBurnApiParam(apiCallParam);
  const { from, to, amount, txnId } = burnApiParam;
  let bridgeTxnObject: BridgeTxnObject;
  logger.info(literals.START_BURNING(amount, from, to));
  res.write(
    `${literals.START_BURNING(amount, from, to)}\n` +
      `${literals.BURN_ALGO_TXN_ID(txnId)}\n` +
      `${literals.BURN_AWAITING}\n`
  );
  res.end();
  try {
    bridgeTxnObject = await burn(burnApiParam);
    logger.info(literals.DONE_BURN);
  } catch (err) {
    res.status(400).send('Missing required query params');
    res.end();
    throw err;
  }
  return bridgeTxnObject;
}

// const apiCallParam: ApiCallParam;
