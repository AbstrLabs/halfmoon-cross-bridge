export {
  EXAMPLE_MALFORMED_UID_FROM_DB,
  EXAMPLE_BURN_TXN_FROM_DB,
  EXAMPLE_NEAR_ADDR,
  EXAMPLE_ALGO_ADDR,
  EXAMPLE_API_PARAM,
  EXAMPLE_TXN_FOR_CREATE_TEST,
};

import { BridgeTxn } from '../../bridge';
import { ENV } from '../../utils/dotenv';
import { TokenId } from '../../common/src/type/token';
import { BridgeTxnStatusEnum } from '../../common/src/type/txn';
import { type ApiCallParam } from '../../utils/type/type';

const EXAMPLE_MALFORMED_UID_FROM_DB =
  '58.2HXYPGDY2EDVERXXQH6UKAT22EQGXWGWPWSJFY3G22AQLNZYTTDA';
const EXAMPLE_FROM_TXN_ID =
  '2HXYPGDY2EDVERXXQH6UKAT22EQGXWGWPWSJFY3G22AQLNZYTTDA';
// outdated EXAMPLE_TXN_FROM_DB
const EXAMPLE_BURN_TXN_FROM_DB = {
  dbId: 1,
  fixedFeeAtom: '10000000000',
  marginFeeAtom: '24691358',
  createdTime: '1656171676417',
  fromAddr: 'ACCSSTKTJDSVP4JPTJWNCGWSDAPHR66ES2AZUAH7MUULEY43DHQSDNR7DA',
  fromAmountAtom: '12345678901',
  fromTokenId: 'goNEAR' as TokenId,
  fromTxnId: '2HXYPGDY2EDVERXXQH6UKAT22EQGXWGWPWSJFY3G22AQLNZYTTDA',
  toAddr: 'abstrlabs-test.testnet',
  toAmountAtom: '2320987543',
  toTokenId: 'NEAR' as TokenId,
  toTxnId: '2VE7QxZZ92PKGkzJzbhf44MTeoxU4LBGXSgXVVAYHNee',
  txnStatus: 'DONE_OUTGOING' as BridgeTxnStatusEnum,
};

// used in XXX
// also used to test double minting
const EXAMPLE_TXN_FOR_CREATE_TEST = new BridgeTxn({
  createdTime: 1656171676417n,
  fixedFeeAtom: 10000000000n,
  fromAddr: 'ACCSSTKTJDSVP4JPTJWNCGWSDAPHR66ES2AZUAH7MUULEY43DHQSDNR7DA',
  fromAmountAtom: 12345678901n,
  fromTokenId: TokenId.goNEAR,
  fromTxnId: '2HXYPGDY2EDVERXXQH6UKAT22EQGXWGWPWSJFY3G22AQLNZYTTDA',
  marginFeeAtom: 24691358n,
  toAddr: 'abstrlabs-test.testnet',
  toAmountAtom: 2320987543n,
  toTokenId: TokenId.NEAR,
  toTxnId: '2VE7QxZZ92PKGkzJzbhf44MTeoxU4LBGXSgXVVAYHNee',
  txnStatus: 'DONE_OUTGOING' as BridgeTxnStatusEnum.DONE_OUTGOING,
});

const EXAMPLE_NEAR_ADDR = ENV.NEAR_EXAMPL_ADDR;
const EXAMPLE_ALGO_ADDR = ENV.ALGO_EXAMPL_ADDR;

const EXAMPLE_API_PARAM: ApiCallParam = {
  // simulates a goNEAR->NEAR burn txn
  from_token: TokenId.goNEAR,
  from_addr: EXAMPLE_ALGO_ADDR,
  to_token: TokenId.NEAR,
  to_addr: EXAMPLE_NEAR_ADDR,
  amount: '1.23456789',
  txn_id: EXAMPLE_FROM_TXN_ID,
};
