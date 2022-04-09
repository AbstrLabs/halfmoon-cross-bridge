import { NearIndexer } from './near';

const exampleFrom = 'abstrlabs-test.testnet';
const exampleTo = 'abstrlabs.testnet';
const exampleAmount = 1;
const exampleTxId = '8mdZck4aC7UCNsM86W7fTqi8P9r1upw8vtoFscqJwgC7';
describe('NearIndexer', () => {
  it.skip('should be defined', () => {
    expect(NearIndexer).toBeDefined();
  });
  it('get txn status', async () => {
    expect(await NearIndexer.getTxnStatus(exampleTxId, exampleFrom)).resolves;
  });
  it('confirm transaction', async () => {
    expect(
      await NearIndexer.confirmTransaction(
        exampleFrom,
        exampleTo,
        exampleAmount,
        exampleTxId
      )
    ).resolves.toBe(true);
  });
});
