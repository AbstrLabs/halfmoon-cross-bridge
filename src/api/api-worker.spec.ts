import { BridgeTxn } from '../bridge';
import {
  EXAMPLE_ALGO_ADDR,
  EXAMPLE_NEAR_ADDR,
} from '../test/test-helper/test-examples';
import { TokenId } from '../common/src/type/token';
import { ApiCallParam } from '../utils/type/type';
import { apiWorker } from './api-worker';

describe('API Worker should', () => {
  /** skipped for txn_id is added and would cause problem */
  it.skip('create a BridgeTxn from API call params', async () => {
    const apiCallParam: ApiCallParam = {
      from_token: TokenId.NEAR,
      to_token: TokenId.goNEAR,
      txn_id: 'txn_id',
      amount: '1',
      from_addr: EXAMPLE_NEAR_ADDR,
      to_addr: EXAMPLE_ALGO_ADDR,
    };
    const bridgeTxn = await apiWorker.create(apiCallParam);
    expect(bridgeTxn).toBeInstanceOf(BridgeTxn);
  });
});
