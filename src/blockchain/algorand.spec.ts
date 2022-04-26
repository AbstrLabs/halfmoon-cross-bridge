import { ENV } from '../utils/dotenv';
import { NOT_LOADED_FROM_ENV } from '../utils/constant';
import { algoBlockchain } from './algorand';

const UNUSED = 'not required value';
const exampleAlgoTxnId = 'NARFYHMI5SDJFNZNXO4NOTNVMXSMRRG2NWPMHTT3GBBKSB5KF4AQ';

describe('AlgorandBlockchain', () => {
  afterAll(() => {});
  it('should be defined', () => {
    expect(algoBlockchain).toBeDefined();
  });
  it('manually check ENV VARS', () => {
    console.log({
      ALGO_MASTER_ADDR: ENV.ALGO_MASTER_ADDR,
      TEST_NET_GO_NEAR_ASSET_ID: ENV.TEST_NET_GO_NEAR_ASSET_ID,
    });
    expect(ENV.ALGO_MASTER_ADDR).not.toBe(NOT_LOADED_FROM_ENV);
    expect(typeof ENV.TEST_NET_GO_NEAR_ASSET_ID).toBe('number');
  });
  // it.skip('user not opted in', () => {});
  it.skip('make a txn, 1 goNEAR, central acc -> example acc', async () => {
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
    console.log('rcpt : ', rcpt); // DEV_LOG_TO_REMOVE
  }, 30000);
});
