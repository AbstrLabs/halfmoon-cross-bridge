import { BridgeTxn } from '../bridge';
import { BridgeTxnStatus } from '..';
// import { ENV } from '../utils/dotenv'; // not sure if we can initialize DB without ENV
import { TxnType } from '../blockchain';
import { db } from './db';
import { exampleBridgeTxn } from '../utils/test/test-example';

describe('DATABASE test', () => {
  describe.skip('CRUD test with Bridge Txn', () => {
    it('create a transaction', async () => {
      const res = await db.createTxn(exampleBridgeTxn);
      expect(typeof res).toBe('number');
    });
    it.skip('read a transaction', async () => {
      // skip: serialize
      // TODO: BT-dbId: have a getter for dbId
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const res = await db.readUniqueTxn(exampleBridgeTxn.dbId!, TxnType.MINT);
      console.log('typeof res : ', typeof res); // DEV_LOG_TO_REMOVE
      console.log(
        'typeof res.from_amount_atom : ',
        typeof res.from_amount_atom
      ); // DEV_LOG_TO_REMOVE
      console.log('res : ', res); // DEV_LOG_TO_REMOVE
      expect(typeof res).toBe('object');

      expect(BridgeTxn.fromDbItem(res, TxnType.MINT)).toEqual(exampleBridgeTxn);
    });
    it('update a transaction', async () => {
      exampleBridgeTxn.txnStatus = BridgeTxnStatus.DONE_OUTGOING;
      exampleBridgeTxn.toTxnId = 'some_fake_txn_id';
      const res1 = await db.updateTxn(exampleBridgeTxn);
      expect(typeof res1).toBe('number');

      // read the updated transaction
      // TODO: BT-dbId: have a getter for dbId
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const res2 = await db.readUniqueTxn(exampleBridgeTxn.dbId!, TxnType.MINT);
      expect(typeof res2).toBe('object');
      // verify updated transaction is correct
      expect(BridgeTxn.fromDbItem(res2, TxnType.MINT)).toEqual(
        exampleBridgeTxn
      );
    });
  });
});
