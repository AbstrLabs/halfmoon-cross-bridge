import { ENV } from '../utils/dotenv';
import { TxnParam } from '../utils/type/type';
import { algoBlockchain } from './algorand';
import { literals } from '../utils/literals';
import { logger } from '../utils/logger';
import { toGoNearAtom } from '../utils/formatter';

const exampleAlgoTxnId = 'NARFYHMI5SDJFNZNXO4NOTNVMXSMRRG2NWPMHTT3GBBKSB5KF4AQ';
// exampleAlgoTxnId === exampleRcpt.transaction.id;
const exampleAlgoParam: TxnParam = {
  fromAddr: 'JMJLRBZQSTS6ZINTD3LLSXCW46K44EI2YZHYKCPBGZP3FLITIQRGPELOBE',
  toAddr: 'ACCSSTKTJDSVP4JPTJWNCGWSDAPHR66ES2AZUAH7MUULEY43DHQSDNR7DA',
  atomAmount: BigInt('4240000000'), // 0.424goNEAR in atomic goNEAR unit
  txnId: exampleAlgoTxnId,
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
  it('should be defined', () => {
    expect(algoBlockchain).toBeDefined();
  });
  it('manually check ENV VARS', () => {
    logger.warn({
      why: 'manually check ENV VARS',
      ALGO_MASTER_ADDR: ENV.ALGO_MASTER_ADDR,
      TEST_NET_GO_NEAR_ASSET_ID: ENV.TEST_NET_GO_NEAR_ASSET_ID,
    });
    expect(ENV.ALGO_MASTER_ADDR).not.toBe(literals.NOT_LOADED_FROM_ENV_STR);
    expect(typeof ENV.TEST_NET_GO_NEAR_ASSET_ID).toBe('number');
  });
  // it.skip('user not opted in', () => {});

  it.skip('make txn, 0.767 goNEAR, central acc -> example acc', async () => {
    // skipped because not returning this transfer.
    // jest.setTimeout(30000); // won't work

    // make a txn (then verify)
    const amount = '0.767';
    const newTxnParam: TxnParam = {
      fromAddr: literals.UNUSED_STR,
      txnId: literals.UNUSED_STR,
      toAddr: ENV.ALGO_EXAMPL_ADDR,
      atomAmount: toGoNearAtom(amount),
    };
    const algoTxnId = await algoBlockchain.makeOutgoingTxn(newTxnParam);
    newTxnParam.txnId = algoTxnId;
    console.info('algoTxnId : ', algoTxnId);

    //verify the txn
    const rcpt = await algoBlockchain.getTxnStatus({
      txnId: algoTxnId,
      fromAddr: literals.UNUSED_STR,
      toAddr: literals.UNUSED_STR,
      atomAmount: literals.UNUSED_BIGINT,
    });
    newTxnParam.fromAddr = ENV.ALGO_MASTER_ADDR;
    const answer = algoBlockchain.verifyCorrectness(rcpt, newTxnParam);
    expect(answer).toBe(true);
    return;
  }, 30000);

  it('get example txn status', async () => {
    const rcpt = await algoBlockchain.getTxnStatus({
      txnId: exampleAlgoTxnId,
      fromAddr: literals.UNUSED_STR,
      toAddr: literals.UNUSED_STR,
      atomAmount: literals.UNUSED_BIGINT,
    });
    expect(rcpt.transaction).toEqual(exampleRcpt.transaction);
  }, 30000);
  it('verify transaction status on algo', async () => {
    const rcpt = await algoBlockchain.getTxnStatus({
      txnId: exampleAlgoTxnId,
      fromAddr: literals.UNUSED_STR,
      toAddr: literals.UNUSED_STR,
      atomAmount: literals.UNUSED_BIGINT,
    });
    const answer = algoBlockchain.verifyCorrectness(rcpt, exampleAlgoParam);
    expect(answer).toBe(true);
  });
});
