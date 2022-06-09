// Used across many tests
export { exampleBridgeTxn };

import { BlockchainName, BridgeTxnStatusEnum } from '../..';

import { BridgeTxn } from '../../bridge';
import { TxnType } from '../../blockchain';

const FAKE_TXN_ID = 'some_fake_txn_id';

// TODO(test): use realistic data.
const exampleBridgeTxn: BridgeTxn = new BridgeTxn({
  txnType: TxnType.MINT,
  fromAmountAtom: BigInt(10000000000), // big int jest err read on top. // should be 0?
  fixedFeeAtom: BigInt(123456),
  marginFeeAtom: BigInt(567890),
  toAmountAtom: BigInt(10000000000),
  dbId: 1,
  fromAddr: '0x1234567890123456789012345678901234567890',
  fromBlockchainName: BlockchainName.NEAR,
  fromTxnId: '0x1234567890123456789012345678901234567890',
  createdTime: BigInt(1650264115011),
  toAddr: '0x1234567890123456789012345678901234567890',
  toBlockchainName: BlockchainName.ALGO,
  toTxnId: FAKE_TXN_ID,
  txnStatus: BridgeTxnStatusEnum.DONE_OUTGOING,
});
