import { ConfirmOutcome } from '.';
import { goNearToAtom } from '../utils/formatter';
import { literals } from '../utils/literals';
import { nearBlockchain } from './near';

const exampleFrom = 'abstrlabs-test.testnet';
const exampleTo = 'abstrlabs.testnet';
const exampleAmount = goNearToAtom('1');
const exampleTxnId = '8mdZck4aC7UCNsM86W7fTqi8P9r1upw8vtoFscqJwgC7';
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
});
