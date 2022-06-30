import { BlockchainName, BridgeTxnStatusEnum } from '../..';
import { TxnType } from '../../blockchain';

export { EXAMPLE_MALFORMED_UID_FROM_DB, EXAMPLE_TXN_FROM_DB };

const EXAMPLE_MALFORMED_UID_FROM_DB =
  '58.2HXYPGDY2EDVERXXQH6UKAT22EQGXWGWPWSJFY3G22AQLNZYTTDA';
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
  txnStatus: 'DONE_INITIALIZE' as BridgeTxnStatusEnum.DONE_INITIALIZE,
  txnType: 'BURN' as TxnType.BURN,
};
