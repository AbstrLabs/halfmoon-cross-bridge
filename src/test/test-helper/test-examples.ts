export {
  EXAMPLE_MALFORMED_UID_FROM_DB,
  EXAMPLE_TXN_FROM_DB,
  EXAMPLE_NEAR_ADDR,
  EXAMPLE_ALGO_ADDR,
  EXAMPLE_API_PARAM,
};

import { BlockchainName, BridgeTxnStatusEnum } from '../..';
import { TxnType } from '../../blockchain';
import { ENV } from '../../utils/dotenv';
import { type NewApiCallParam } from '../../utils/type';

const EXAMPLE_MALFORMED_UID_FROM_DB =
  '58.2HXYPGDY2EDVERXXQH6UKAT22EQGXWGWPWSJFY3G22AQLNZYTTDA';
const EXAMPLE_FROM_TXN_ID =
  '2HXYPGDY2EDVERXXQH6UKAT22EQGXWGWPWSJFY3G22AQLNZYTTDA';
const EXAMPLE_TXN_FROM_DB = {
  createdTime: '1656171676417',
  dbId: 57,
  fixedFeeAtom: '10000000000',
  fromAddr: 'ACCSSTKTJDSVP4JPTJWNCGWSDAPHR66ES2AZUAH7MUULEY43DHQSDNR7DA',
  fromAmountAtom: '12345678901',
  fromBlockchainName: 'ALGO' as BlockchainName.NEAR,
  fromTxnId: '2HXYPGDY2EDVERXXQH6UKAT22EQGXWGWPWSJFY3G22AQLNZYTTDA',
  marginFeeAtom: '24691358',
  toAddr: 'abstrlabs-test.testnet',
  toAmountAtom: '2320987543',
  toBlockchainName: 'NEAR' as BlockchainName.NEAR,
  toTxnId: '2VE7QxZZ92PKGkzJzbhf44MTeoxU4LBGXSgXVVAYHNee',
  txnStatus: 'DONE_OUTGOING' as BridgeTxnStatusEnum.DONE_OUTGOING,
  txnType: 'BURN' as TxnType.BURN,
};

const EXAMPLE_NEAR_ADDR = ENV.NEAR_EXAMPL_ADDR;
const EXAMPLE_ALGO_ADDR = ENV.ALGO_EXAMPL_ADDR;

const EXAMPLE_API_PARAM: NewApiCallParam = {
  // simulates a goNEAR->NEAR burn txn
  from_id: 'goNEAR',
  from_addr: EXAMPLE_ALGO_ADDR,
  to_id: 'NEAR',
  to_addr: EXAMPLE_NEAR_ADDR,
  amount: '1.23456789',
  txn_id: EXAMPLE_FROM_TXN_ID,
};
