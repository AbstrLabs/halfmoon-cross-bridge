import { EXAMPLE_TXN_FROM_DB } from '../test/test-helper/test-examples';
import { BridgeTxn } from './bridge-txn';

describe('Class BridgeTxn', () => {
  it('equals does not override equal operator', () => {
    const bridgeTxn1 = BridgeTxn.fromObject(EXAMPLE_TXN_FROM_DB);
    const bridgeTxn2 = BridgeTxn.fromObject(EXAMPLE_TXN_FROM_DB);
    expect(bridgeTxn1.toString() === bridgeTxn2.toString()).toBe(true);
    expect(bridgeTxn1 === bridgeTxn2).toBe(false);
  });
});
