import {
  BlockchainName,
  BridgeTxnStatus,
  type BridgeTxnInfo,
  type BurnApiParam,
  type MintApiParam,
} from '..';
import { BridgeError, ERRORS } from './errors';
import {
  dbItemToBridgeTxnInfo,
  parseBurnApiParam,
  parseMintApiParam,
} from './formatter';

import { ENV } from './dotenv';
import { exampleBridgeTxnInfo } from './test-helper';

const FAKE_TX_ID = 'some_fake_txn_id';
const exampleDbItem = {
  // TODO: this is deprecated. for receivedAtomNumber, fixedFeeAtomNumber, marginFeeAtomNumber
  algo_txn_id: FAKE_TX_ID,
  algorand_address: '0x1234567890123456789012345678901234567890',
  amount: '10000000000',
  create_time: '1650264115011',
  id: 1,
  near_address: '0x1234567890123456789012345678901234567890',
  near_tx_hash: '0x1234567890123456789012345678901234567890',
  request_status: 'DONE_OUTGOING',
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
    expect(
      dbItemToBridgeTxnInfo(exampleDbItem, {
        fromBlockchain: BlockchainName.NEAR,
        toBlockchain: BlockchainName.ALGO,
      })
    ).toEqual(exampleBridgeTxnInfo);
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
          unusedField: 'this does not matter',
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
          unusedField: 'this does not matter',
        })
      );
    });
  });
});
