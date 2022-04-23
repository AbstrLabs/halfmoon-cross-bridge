import { BlockchainName, BridgeTxInfo, BridgeTxStatus } from '..';
import { log, logger } from './logger';

import { dbItemToBridgeTxInfo } from './formatter';

const sampleDbItem = {
  algo_txn_id: 'some_fake_tx_id',
  algorand_address: '0x1234567890123456789012345678901234567890',
  amount: '10000000000',
  create_time: '1650264115011',
  id: 1,
  near_address: '0x1234567890123456789012345678901234567890',
  near_tx_hash: '0x1234567890123456789012345678901234567890',
  request_status: 'DONE_SEND',
};

const sampleTxInfo: BridgeTxInfo = {
  amount: BigInt(10000000000), // big int jest err read on top.
  dbId: 1,
  fromAddr: '0x1234567890123456789012345678901234567890',
  fromBlockchain: BlockchainName.NEAR,
  fromTxId: '0x1234567890123456789012345678901234567890',
  timestamp: BigInt('1650264115011'),
  toAddr: '0x1234567890123456789012345678901234567890',
  toBlockchain: BlockchainName.ALGO,
  toTxId: 'some_fake_tx_id',
  txStatus: BridgeTxStatus.DONE_SEND,
};

describe('utils tool test, should skip', () => {
  describe('logger', () => {
    it('log "something"', () => {
      logger.info('something');
      log('something');
      console.log('something'); // this is bette to show call stack
    });
  });
  it('formatter test', () => {
    // for "TypeError: Do not know how to serialize a BigInt", use `--maxWorkers=1`
    // from https://github.com/facebook/jest/issues/11617#issuecomment-1068732414
    expect(
      dbItemToBridgeTxInfo(sampleDbItem, {
        fromBlockchain: BlockchainName.NEAR,
        toBlockchain: BlockchainName.ALGO,
      })
    ).toEqual(sampleTxInfo);
  });
});
