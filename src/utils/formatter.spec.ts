import { type BurnApiParam, type MintApiParam } from '..';
import { BridgeError, ERRORS } from './errors';
import { parseBurnApiParam, parseMintApiParam } from './formatter';

import { ENV } from './dotenv';
import { exampleBridgeTxnInfo } from './test-helper';
import { TxnType } from '../blockchain';
import { BridgeTxnInfo } from '../blockchain/bridge';

// TODO: move to test-helper + ren
const FAKE_TX_ID = 'some_fake_txn_id';
const FAKE_ADDR = '0x1234567890123456789012345678901234567890';

// TODO: interface for this exampleDbItem with zod
const exampleDbItem = {
  db_id: 1,
  from_addr: 'some_from_addr',
  from_amount_atom: '10000000000',
  from_txn_id: FAKE_TX_ID,
  to_addr: 'some_to_addr',
  to_amount_atom: '642398',
  to_txn_id: FAKE_TX_ID,
  txn_status: 'some_txn_status',
  txn_type: 'some_txn_type',
  create_time: '1650264115011',
  fixed_fee_atom: '567890',
  margin_fee_atom: '53789243',
};

const exampleMintApiTxnInfo: MintApiParam = {
  amount: '1.00',
  to: ENV.ALGO_EXAMPL_ADDR,
  from: ENV.NEAR_EXAMPL_ADDR,
  txnId: FAKE_TX_ID,
};
const exampleBurnApiTxnInfo: BurnApiParam = {
  amount: '1.00',
  to: ENV.NEAR_EXAMPL_ADDR,
  from: ENV.ALGO_EXAMPL_ADDR,
  txnId: FAKE_TX_ID,
};

describe('param validation and formatting', () => {
  it('formatter test', () => {
    // for "TypeError: Do not know how to serialize a BigInt", use `--maxWorkers=1`
    // from https://github.com/facebook/jest/issues/11617#issuecomment-1068732414
    expect(BridgeTxnInfo.fromDbItem(exampleDbItem, TxnType.MINT)).toEqual(
      exampleBridgeTxnInfo
    ); // need --workers=1 flag
  });
  describe('parseMintApiInfo', () => {
    it('parse mint api call', () => {
      const apiTxnInfo = parseMintApiParam(exampleMintApiTxnInfo);
      expect(apiTxnInfo).toEqual(exampleMintApiTxnInfo);
    });
    it('parse wrong malformed api call', () => {
      // TODO: now we cannot distinguish between the error message and the error detail
      const wrongToAddrApiTxnInfo = {
        ...exampleMintApiTxnInfo,
        to: exampleMintApiTxnInfo.to.slice(0, -1),
      };
      expect(() => {
        parseMintApiParam(wrongToAddrApiTxnInfo);
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
      const apiTxnInfo = parseBurnApiParam(exampleBurnApiTxnInfo);
      expect(apiTxnInfo).toEqual(exampleBurnApiTxnInfo);
    });
    it('parse wrong malformed api call', () => {
      // TODO: now we cannot distinguish between the error message and the error detail
      const wrongToAddrApiTxnInfo = {
        ...exampleBurnApiTxnInfo,
        to: exampleBurnApiTxnInfo.to.slice(0, -1),
      };
      expect(() => {
        parseBurnApiParam(wrongToAddrApiTxnInfo);
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
