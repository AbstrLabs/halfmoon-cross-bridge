import { ENV } from '../utils/dotenv';
import { algoBlockchain } from './algorand';

const UNUSED = 'not required value';

describe('AlgorandBlockchain', () => {
  it('should be defined', () => {
    expect(algoBlockchain).toBeDefined();
  });
  it('manually check ENV VARS', () => {
    console.info({
      ALGO_MASTER_ADDR: ENV.ALGO_MASTER_ADDR,
      TEST_NET_GO_NEAR_ASSET_ID: ENV.TEST_NET_GO_NEAR_ASSET_ID,
    });
    expect(ENV.ALGO_MASTER_ADDR).not.toBe('NOT_LOADED_FROM_ENV');
    expect(typeof ENV.TEST_NET_GO_NEAR_ASSET_ID).toBe('number');
  });

  it('make a txn, 1 goNEAR, acc -> example acc', async () => {
    jest.setTimeout(30000); // 30sec
    const txnId = await algoBlockchain.makeOutgoingTxn({
      from: UNUSED,
      txId: UNUSED,
      to: ENV.ALGO_EXAMPL_ADDR,
      amount: '1',
    });
    console.info('txnId : ', txnId);
    return;
  });
});
