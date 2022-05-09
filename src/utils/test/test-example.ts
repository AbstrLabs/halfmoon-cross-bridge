// Used across many tests
export { exampleBridgeTxn };

import { BlockchainName, BridgeTxnStatus } from '../..';

import { BridgeTxn } from '../../blockchain/bridge';

const FAKE_TXN_ID = 'some_fake_txn_id';

// TODO: test: user realistic data.
const exampleBridgeTxn: BridgeTxn = new BridgeTxn({
  // this is a mint txn
  fromAmountAtom: BigInt(10000000000), // big int jest err read on top.
  fixedFeeAtom: BigInt(123456),
  marginFeeAtom: BigInt(567890),
  toAmountAtom: BigInt(10000000000),
  dbId: 1,
  fromAddr: '0x1234567890123456789012345678901234567890',
  fromBlockchain: BlockchainName.NEAR,
  fromTxnId: '0x1234567890123456789012345678901234567890',
  createdTime: BigInt(1650264115011),
  toAddr: '0x1234567890123456789012345678901234567890',
  toBlockchain: BlockchainName.ALGO,
  toTxnId: FAKE_TXN_ID,
  txnStatus: BridgeTxnStatus.DONE_OUTGOING,
});
