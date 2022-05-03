// Used across many tests
export { exampleBridgeTxnInfo };

import { BlockchainName, BridgeTxnInfo, BridgeTxnStatus } from '..';

const FAKE_TX_ID = 'some_fake_txn_id';

const exampleBridgeTxnInfo: BridgeTxnInfo = {
  // this is a mint txn
  fromAmountAtom: BigInt(10000000000), // big int jest err read on top.
  fixedFeeAtom: BigInt(0),
  marginFeeAtom: BigInt(0),
  toAmountAtom: BigInt(10000000000),
  dbId: 1,
  fromAddr: '0x1234567890123456789012345678901234567890',
  fromBlockchain: BlockchainName.NEAR,
  fromTxnId: '0x1234567890123456789012345678901234567890',
  timestamp: BigInt('1650264115011'),
  toAddr: '0x1234567890123456789012345678901234567890',
  toBlockchain: BlockchainName.ALGO,
  toTxnId: FAKE_TX_ID,
  txnStatus: BridgeTxnStatus.DONE_OUTGOING,
};
