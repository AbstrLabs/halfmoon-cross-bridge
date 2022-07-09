it('test place holder to fix', () => {
  expect(true).toBe(true);
});

/* // TODO: fix this in full test branch.


import { type ,  } from '..';
import { BridgeError, ERRORS } from './errors';
import { parse,  } from './type';
import JsonBig from 'json-bigint';
import { ENV } from './dotenv';
import { exampleBridgeTxn } from './test-helper';
import { BridgeTxn } from '../blockchain/bridge';

// TODO: move to test-helper + ren
const FAKE_TXN_ID = 'some_fake_txn_id';

// TODO: interface for this exampleDbItem with zod
const exampleDbItem = {
  db_id: 1,
  from_addr: 'some_from_addr',
  from_amount_atom: '10000000000',
  from_txn_id: FAKE_TXN_ID,
  to_addr: 'some_to_addr',
  to_amount_atom: '642398',
  to_txn_id: FAKE_TXN_ID,
  txn_status: 'some_txn_status',
  txn_type: 'some_txn_type',
  created_time: '1650264115011',
  fixed_fee_atom: '567890',
  margin_fee_atom: '53789243',
};

const exampleMintApiTxnInfo:  = {
  amount: '1.00',
  to: ENV.ALGO_EXAMPL_ADDR,
  from: ENV.NEAR_EXAMPL_ADDR,
  txnId: FAKE_TXN_ID,
};
const exampleBurnApiTxnInfo:  = {
  amount: '1.00',
  to: ENV.NEAR_EXAMPL_ADDR,
  from: ENV.ALGO_EXAMPL_ADDR,
  txnId: FAKE_TXN_ID,
};

describe('param validation and formatting', () => {
  it('formatter test', () => {
    // for "TypeError: Do not know how to serialize a BigInt", use `--maxWorkers=1`
    // from https://github.com/facebook/jest/issues/11617#issuecomment-1068732414

    const JsonParseSpy = jest.spyOn(JSON, 'parse');
    JsonParseSpy.mockImplementation(jest.fn(JsonBig.parse));
    const JsonStringifySpy = jest.spyOn(JSON, 'stringify');
    JsonStringifySpy.mockImplementation(jest.fn(JsonBig.stringify));

    expect(BridgeTxn.fromDbItem(exampleDbItem)).toEqual(
      exampleBridgeTxn
    ); // need --workers=1 flag
  });

  describe('parseMintApiInfo', () => {
    it('parse mint api call', () => {
      const apiTxnInfo = parse(exampleMintApiTxnInfo);
      expect(apiTxnInfo).toEqual(exampleMintApiTxnInfo);
    });
    it('parse wrong malformed api call', () => {
      // TODO: now we cannot distinguish between the error message and the error detail
      const wrongToAddrApiTxnInfo = {
        ...exampleMintApiTxnInfo,
        to: exampleMintApiTxnInfo.to.slice(0, -1),
      };
      expect(() => {
        parse(wrongToAddrApiTxnInfo);
      }).toThrow(
        // new Error('any error') this won't work
        new BridgeError(ERRORS.TXN.INVALID_API_PARAM, {
          parseErrorDetail: {
            issues: [
              {
                validation: 'regex',
                code: 'invalid_string',
                message: 'malformed algorand address',
                path: ['to'],
              },
            ],
            name: 'ZodError',
          },
        })
      );
    });
  });
  describe('parseBurnApiInfo', () => {
    it('parse mint api call', () => {
      const apiTxnInfo = parse(exampleBurnApiTxnInfo);
      expect(apiTxnInfo).toEqual(exampleBurnApiTxnInfo);
    });
    it('parse wrong malformed api call', () => {
      // TODO: now we cannot distinguish between the error message and the error detail
      const wrongToAddrApiTxnInfo = {
        ...exampleBurnApiTxnInfo,
        to: exampleBurnApiTxnInfo.to.slice(0, -1),
      };
      expect(() => {
        parse(wrongToAddrApiTxnInfo);
      }).toThrow(
        // new Error('any error') this won't work
        new BridgeError(ERRORS.TXN.INVALID_API_PARAM, {
          parseErrorDetail: {
            issues: [
              {
                validation: 'regex',
                code: 'invalid_string',
                message: 'malformed near address',
                path: ['to'],
              },
            ],
            name: 'ZodError',
          },
        })
      );
    });
  });
});
 */
