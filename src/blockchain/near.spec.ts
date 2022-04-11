import { NearBlockchain } from './near';

const exampleFrom = 'abstrlabs-test.testnet';
const exampleTo = 'abstrlabs.testnet';
const exampleAmount = '1';
const exampleTxId = '8mdZck4aC7UCNsM86W7fTqi8P9r1upw8vtoFscqJwgC7';
describe('NearBlockchain', () => {
  it.skip('should be defined', () => {
    expect(NearBlockchain).toBeDefined();
  });
  it('get txn status', async () => {
    expect(
      await NearBlockchain.getTxnStatus(exampleTxId, exampleFrom)
    ).toBeDefined();
  });
  it('confirm transaction', async () => {
    expect(
      await NearBlockchain.confirmTransaction({
        from: exampleFrom,
        to: exampleTo,
        amount: exampleAmount,
        txId: exampleTxId,
      })
    ).toBe(true);
  });
});
