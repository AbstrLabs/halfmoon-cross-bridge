import {
  BlockchainName,
  BridgeTxStatus,
  type BridgeTxInfo,
  type MintApiParam,
  type BurnApiParam,
} from '..';
import { BridgeError, ERRORS } from './errors';
import {
  dbItemToBridgeTxInfo,
  parseBurnApiParam,
  parseMintApiParam,
} from './formatter';

import { ENV } from './dotenv';

const FAKE_TX_ID = 'some_fake_tx_id';
const exampleDbItem = {
  algo_txn_id: 'some_fake_tx_id',
  algorand_address: '0x1234567890123456789012345678901234567890',
  amount: '10000000000',
  create_time: '1650264115011',
  id: 1,
  near_address: '0x1234567890123456789012345678901234567890',
  near_tx_hash: '0x1234567890123456789012345678901234567890',
  request_status: 'DONE_OUTGOING',
};

const exampleTxInfo: BridgeTxInfo = {
  amount: BigInt(10000000000), // big int jest err read on top.
  dbId: 1,
  fromAddr: '0x1234567890123456789012345678901234567890',
  fromBlockchain: BlockchainName.NEAR,
  fromTxId: '0x1234567890123456789012345678901234567890',
  timestamp: BigInt('1650264115011'),
  toAddr: '0x1234567890123456789012345678901234567890',
  toBlockchain: BlockchainName.ALGO,
  toTxId: 'some_fake_tx_id',
  txStatus: BridgeTxStatus.DONE_OUTGOING,
};

const exampleMintApiTxInfo: MintApiParam = {
  amount: '1.00',
  to: ENV.ALGO_EXAMPL_ADDR,
  from: ENV.NEAR_EXAMPL_ADDR,
  txId: FAKE_TX_ID,
};
const exampleBurnApiTxInfo: BurnApiParam = {
  amount: '1.00',
  to: ENV.NEAR_EXAMPL_ADDR,
  from: ENV.ALGO_EXAMPL_ADDR,
  txId: FAKE_TX_ID,
};

describe('param validation and formatting', () => {
  it('formatter test', () => {
    // for "TypeError: Do not know how to serialize a BigInt", use `--maxWorkers=1`
    // from https://github.com/facebook/jest/issues/11617#issuecomment-1068732414
    expect(
      dbItemToBridgeTxInfo(exampleDbItem, {
        fromBlockchain: BlockchainName.NEAR,
        toBlockchain: BlockchainName.ALGO,
      })
    ).toEqual(exampleTxInfo);
  });
  describe('parseMintApiInfo', () => {
    it('parse mint api call', () => {
      const apiTxInfo = parseMintApiParam(exampleMintApiTxInfo);
      expect(apiTxInfo).toEqual(exampleMintApiTxInfo);
    });
    it('parse wrong malformed api call', () => {
      // TODO: now we cannot distinguish between the error message and the error detail
      const wrongToAddrApiTxInfo = {
        ...exampleMintApiTxInfo,
        to: exampleMintApiTxInfo.to.slice(0, -1),
      };
      expect(() => {
        parseMintApiParam(wrongToAddrApiTxInfo);
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
      const apiTxInfo = parseBurnApiParam(exampleBurnApiTxInfo);
      expect(apiTxInfo).toEqual(exampleBurnApiTxInfo);
    });
    it('parse wrong malformed api call', () => {
      // TODO: now we cannot distinguish between the error message and the error detail
      const wrongToAddrApiTxInfo = {
        ...exampleBurnApiTxInfo,
        to: exampleBurnApiTxInfo.to.slice(0, -1),
      };
      expect(() => {
        parseBurnApiParam(wrongToAddrApiTxInfo);
      }).toThrow(
        // new Error('any error') this won't work
        new BridgeError(ERRORS.TXN.INVALID_API_PARAM, {
          unusedField: 'this does not matter',
        })
      );
    });
  });
});
