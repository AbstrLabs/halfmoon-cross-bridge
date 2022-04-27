import { ENV } from '../utils/dotenv';
import { NOT_LOADED_FROM_ENV } from '../utils/constant';
import { algoBlockchain } from './algorand';
import { logger } from '../utils/logger';
import { verify } from 'crypto';

const UNUSED = 'not required value';
const exampleAlgoTxnId = 'NARFYHMI5SDJFNZNXO4NOTNVMXSMRRG2NWPMHTT3GBBKSB5KF4AQ';
// exampleAlgoTxnId === exampleRcpt.transaction.id;
const exampleAlgoTxn = {
  from: 'JMJLRBZQSTS6ZINTD3LLSXCW46K44EI2YZHYKCPBGZP3FLITIQRGPELOBE',
  to: 'ACCSSTKTJDSVP4JPTJWNCGWSDAPHR66ES2AZUAH7MUULEY43DHQSDNR7DA',
  amount: '4240000000', // 0.424goNEAR in atom goNEAR
  txId: exampleAlgoTxnId,
};
const exampleRcpt = {
  // should be the same as rcpt used
  'current-round': 21212611,
  transaction: {
    'asset-transfer-transaction': {
      amount: 4240000000,
      'asset-id': 83251085,
      'close-amount': 0,
      receiver: 'ACCSSTKTJDSVP4JPTJWNCGWSDAPHR66ES2AZUAH7MUULEY43DHQSDNR7DA',
    },
    'close-rewards': 0,
    'closing-amount': 0,
    'confirmed-round': 21175833,
    fee: 1000,
    'first-valid': 21175829,
    'genesis-hash': 'SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=',
    'genesis-id': 'testnet-v1.0',
    id: 'NARFYHMI5SDJFNZNXO4NOTNVMXSMRRG2NWPMHTT3GBBKSB5KF4AQ',
    'intra-round-offset': 0,
    'last-valid': 21176829,
    'receiver-rewards': 0,
    'round-time': 1650813137,
    sender: 'JMJLRBZQSTS6ZINTD3LLSXCW46K44EI2YZHYKCPBGZP3FLITIQRGPELOBE',
    'sender-rewards': 0,
    signature: {
      sig: 'XgETsHdsdJEQb6lfxxxhy4YHkdDQcdFQw39Pi80fBDjyKMVyVkiUlhucmmq1DFVXSber7uB033UyT+Q8kVNvAQ==',
    },
    'tx-type': 'axfer',
  },
};

describe('AlgorandBlockchain', () => {
  afterAll(() => {});
  it('should be defined', () => {
    expect(algoBlockchain).toBeDefined();
  });
  it('manually check ENV VARS', () => {
    logger.warn({
      ALGO_MASTER_ADDR: ENV.ALGO_MASTER_ADDR,
      TEST_NET_GO_NEAR_ASSET_ID: ENV.TEST_NET_GO_NEAR_ASSET_ID,
    });
    expect(ENV.ALGO_MASTER_ADDR).not.toBe(NOT_LOADED_FROM_ENV);
    expect(typeof ENV.TEST_NET_GO_NEAR_ASSET_ID).toBe('number');
  });
  // it.skip('user not opted in', () => {});

  it.skip('make txn, 1 goNEAR, central acc -> example acc', async () => {
    // skipped because not returning this 1 atom.
    // jest.setTimeout(30000); // won't work
    const algoTxId = await algoBlockchain.makeOutgoingTxn({
      from: UNUSED,
      txId: UNUSED,
      to: ENV.ALGO_EXAMPL_ADDR,
      amount: '1',
    });
    console.info('algoTxId : ', algoTxId);
    return;
  }, 30000);
  it.only('get example txn status', async () => {
    const rcpt = await algoBlockchain.getTxnStatus(exampleAlgoTxnId);
    expect(rcpt.transaction).toEqual(exampleRcpt.transaction);
  }, 30000);
  it.only('verify transaction status on algo', async () => {
    const rcpt = await algoBlockchain.getTxnStatus(exampleAlgoTxnId);
    const answer = algoBlockchain.verifyCorrectness(rcpt, exampleAlgoTxn);
    expect(answer).toBe(true);
  });
});
