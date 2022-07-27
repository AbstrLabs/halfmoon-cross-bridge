// Used across many tests
export { exampleBridgeTxn };

import { BridgeTxn } from '../../bridge';
import { TokenId } from '../../common/src/type/token';
import { BridgeTxnStatusEnum } from '../../common/src/type/txn';

const FAKE_TXN_ID = 'some_fake_txn_id';

// TODO [TEST]: use realistic data.
// TODO [TEST]: fix this. use test-examples. ref better name. like test-data.
const exampleBridgeTxn: BridgeTxn = new BridgeTxn({
  fromAmountAtom: BigInt(10000000000), // big int jest err read on top. // should be 0?
  fixedFeeAtom: BigInt(123456),
  marginFeeAtom: BigInt(567890),
  toAmountAtom: BigInt(10000000000),
  dbId: 1,
  fromAddr: '0x1234567890123456789012345678901234567890',
  fromTxnId: '0x1234567890123456789012345678901234567890',
  fromTokenId: TokenId.NEAR,
  createdTime: BigInt(1650264115011),
  toAddr: '0x1234567890123456789012345678901234567890',
  toTxnId: FAKE_TXN_ID,
  toTokenId: TokenId.goNEAR,
  txnStatus: BridgeTxnStatusEnum.DONE_OUTGOING,
});
