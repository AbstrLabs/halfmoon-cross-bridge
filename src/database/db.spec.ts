import { BridgeTxn } from '../bridge';
import { BridgeTxnStatusEnum } from '..';
// import { ENV } from '../utils/dotenv'; // not sure if we can initialize DB without ENV
import { TxnType } from '../blockchain';
import { db } from './db';
import { exampleBridgeTxn } from '../utils/test/test-example';

describe('DATABASE test', () => {
  describe.skip('CRUD test with Bridge Txn', () => {
    it('create a transaction', async () => {
      // should test with bridgeTxn
      const res = await db.createTxn(exampleBridgeTxn);
      expect(typeof res).toBe('number');
    });
    it.skip('read a transaction', async () => {
      // skip: serialize bigint
      // should test with bridgeTxn
      exampleBridgeTxn.dbId = exampleBridgeTxn.getDbId();
      const res = await db.readTxn(exampleBridgeTxn.dbId, TxnType.MINT);
      expect(typeof res).toBe('object');

      expect(BridgeTxn.fromDbItem(res, TxnType.MINT)).toEqual(exampleBridgeTxn);
    });
    it('update a transaction', async () => {
      exampleBridgeTxn.txnStatus = BridgeTxnStatusEnum.DONE_OUTGOING;
      exampleBridgeTxn.toTxnId = 'some_fake_txn_id';
      const res1 = await db.updateTxn(exampleBridgeTxn);
      expect(typeof res1).toBe('number');

      // read the updated transaction
      // should test with bridgeTxn
      exampleBridgeTxn.dbId = exampleBridgeTxn.getDbId();
      const res2 = await db.readTxn(exampleBridgeTxn.dbId, TxnType.MINT);
      expect(typeof res2).toBe('object');
      // verify updated transaction is correct
      expect(BridgeTxn.fromDbItem(res2, TxnType.MINT)).toEqual(
        exampleBridgeTxn
      );
    });
  });
  it('should read all burn txn in db', async () => {
    const res = await db.readAllTxn(TxnType.BURN);
    expect(typeof res).toBe('object');
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
  });
});
