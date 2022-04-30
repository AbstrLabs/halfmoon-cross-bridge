import {
  BlockchainName,
  BridgeTxInfo,
  BridgeTxStatus,
  GenericTxInfo,
} from '..';
import { dbItemToBridgeTxInfo, parseMintApiInfo } from './formatter';

import { ENV } from './dotenv';

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

const exampleApiTxInfo: GenericTxInfo = {
  amount: '1',
  to: ENV.ALGO_EXAMPL_ADDR,
  from: ENV.NEAR_EXAMPL_ADDR,
  txId: 'some_fake_tx_id',
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
  it('parse mint api call', () => {
    const apiTxInfo = parseMintApiInfo(exampleApiTxInfo);
    expect(apiTxInfo).toEqual(exampleApiTxInfo);
  });
  it('parse wrong misformed api call', () => {
    const wrongApiTxInfo = {
      ...exampleApiTxInfo,
      to: exampleApiTxInfo.to.slice(0, -1),
    };
    expect(() => {
      parseMintApiInfo(wrongApiTxInfo);
    }).toThrow();
  });
});
