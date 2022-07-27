import { ConfirmOutcome } from './abstract-base';
import { ENV } from '../utils/env';
import { literals } from '../utils/bridge-const';
import { nearBlockchain } from './near';
import { toGoNearAtom } from '../utils/formatter';

const exampleFrom = ENV.NEAR_EXAMPL_ADDR;
const exampleTo = ENV.NEAR_MASTER_ADDR;
const exampleAmount = toGoNearAtom('1');
const exampleTxnId = '8mdZck4aC7UCNsM86W7fTqi8P9r1upw8vtoFscqJwgC7'; // TODO [TEST]: use temp string
describe('nearBlockchain', () => {
  it.skip('should be defined', () => {
    expect(nearBlockchain).toBeDefined();
  });
  it('get txn status', async () => {
    expect(
      await nearBlockchain.getTxnStatus({
        txnId: exampleTxnId,
        fromAddr: exampleFrom,
        toAddr: exampleTo,
        atomAmount: literals.UNUSED_BIGINT,
      })
    ).toBeDefined();
  });
  it('confirm transaction', async () => {
    expect(
      await nearBlockchain.confirmTxn({
        fromAddr: exampleFrom,
        toAddr: exampleTo,
        atomAmount: exampleAmount,
        txnId: exampleTxnId,
      })
    ).toBe(ConfirmOutcome.SUCCESS);
  });
  // it.skip('transfer 0.123 Near from example to master', async () => {});
});
