import { EXAMPLE_BURN_TXN_FROM_DEV_TABLE } from '../test/test-helper/test-examples';
import { BridgeTxn } from './bridge-txn';

describe('Class BridgeTxn should', () => {
  it('equals between two instances with same attrs', () => {
    const bridgeTxn1 = BridgeTxn.fromObject(EXAMPLE_BURN_TXN_FROM_DEV_TABLE);
    const bridgeTxn2 = BridgeTxn.fromObject(EXAMPLE_BURN_TXN_FROM_DEV_TABLE);
    expect(bridgeTxn1.toString() === bridgeTxn2.toString()).toBe(true);
    expect(bridgeTxn1 === bridgeTxn2).toBe(false);
  });

  it('calculates margin fee correctly', () => {
    const txn = {
      ...EXAMPLE_BURN_TXN_FROM_DEV_TABLE,
    };
    const bridgeTxn = new BridgeTxn({
      fromAddr: txn.fromAddr,
      fromAmountAtom: txn.fromAmountAtom,
      fromTokenId: txn.fromTokenId,
      toAddr: txn.toAddr,
      toAmountAtom: txn.toAmountAtom,
      toTokenId: txn.toTokenId,
      fixedFeeAtom: undefined,
      marginFeeAtom: undefined,
      fromTxnId: txn.fromTxnId,
    });
    expect(bridgeTxn.toSafeObject().marginFeeAtom).toBe(txn.marginFeeAtom);
  });
});
