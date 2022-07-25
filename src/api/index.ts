import { TokenId } from '../utils/type/shared-types/token';
import { BridgeTxnStatusEnum } from '../utils/type/shared-types/txn';

export { WELCOME_JSON };

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-var-requires
const version = require('../../package.json').version as string;

const WELCOME_JSON = {
  MESSAGE: 'Welcome to the Algorand-NEAR bridge API',
  FRONTEND: 'https://halfmooncross.com/',
  API_VERSION: version,
  API_SERVER: 'https://api.halfmooncross.com/',
  API_ENDPOINT: [
    {
      URL: 'https://api.halfmooncross.com/algorand-near',
      METHOD: 'POST',
      BODY: {
        from_token: ['literal("NEAR","goNEAR")', 'case sensitive'],
        from_addr: ['string', 'public address of the sender'],
        to_token: ['literal("NEAR","goNEAR")', 'case sensitive'],
        to_addr: ['string', 'public address of the receiver'],
        amount: ['string', 'up to 10 decimal places'],
        txn_id: ['string', 'transaction ID'],
      },
      RESPOND_JSON_TYPE: {
        BridgeTxnStatus: 'enum BridgeTxnStatusEnum',
        uid: 'string with form {number}.{txnId}',
      },
      RESPOND_JSON_EXAMPLE: {
        BridgeTxnStatus: 'DONE_INITIALIZE',
        uid: '1.2HXYPGDY2EDVERXXQH6UKAT22EQGXWGWPWSJFY3G22AQLNZYTTDA',
      },
    },
    {
      URL: 'https://api.halfmooncross.com/algorand-near',
      METHOD: 'GET',
      PARAMS: {
        uid: ['string', 'with form {number}.{txnId}'],
      },
      RESPOND_JSON_TYPE: {
        dbId: 'number',
        fixedFeeAtom: 'bigint as string',
        marginFeeAtom: 'bigint as string',
        createdTime: 'bigint as string',
        fromAddr: 'string',
        fromAmountAtom: 'bigint as string',
        fromTokenId: 'enum TokenId',
        fromTxnId: 'string',
        toAddr: 'string',
        toAmountAtom: 'bigint as string',
        toTokenId: 'enum TokenId',
        toTxnId: 'string | null',
        txnStatus: 'enum BridgeTxnStatusEnum',
        comment: 'string | null',
      },
      RESPOND_JSON_EXAMPLE: {
        dbId: 1,
        fixedFeeAtom: '10000000000',
        marginFeeAtom: '24691358',
        createdTime: '1656171676417',
        fromAddr: 'ACCSSTKTJDSVP4JPTJWNCGWSDAPHR66ES2AZUAH7MUULEY43DHQSDNR7DA',
        fromAmountAtom: '12345678901',
        fromTokenId: 'goNEAR',
        fromTxnId: '2HXYPGDY2EDVERXXQH6UKAT22EQGXWGWPWSJFY3G22AQLNZYTTDA',
        toAddr: 'abstrlabs-test.testnet',
        toAmountAtom: '2320987543',
        toTokenId: 'NEAR',
        toTxnId: '2VE7QxZZ92PKGkzJzbhf44MTeoxU4LBGXSgXVVAYHNee',
        txnStatus: 'DONE_OUTGOING',
      },
    },
  ],
  TYPE_INFO: {
    enums: {
      TokenId: Object.values(TokenId),
      BridgeTxnStatusEnum: Object.values(BridgeTxnStatusEnum),
    },
  },
  ADDITIONAL_INFO: {
    SERVER_UP_TIMESTAMP: new Date().toISOString(),
  },
};
