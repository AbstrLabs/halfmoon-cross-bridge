import {
  type algoAddr,
  type nearAddr,
  type addr,
  type nearTxHash,
  type algoTxnId,
  type TxID,
  TxType,
} from '.';
import { log } from '../utils/logger';
export { mint };

async function mint(
  from: nearAddr,
  to: algoAddr,
  amount: number,
  hash: nearTxHash
): Promise<void> {
  if (!from || !to || !amount) {
    throw new Error('Missing required params');
  }
  // const amount = +amount;
  log(`Minting ${amount} NEAR from ${from}(NEAR) to ${to}(ALGO)`);
  await bridge_txn_maker(from, to, amount, hash, TxType.Mint);
  log('fake mint success');
  return;
}

// function* burn(
//   from: algoAddr,
//   to: nearAddr,
//   amount: number
// ): Generator<string> {
//   if (!from || !to || !amount) {
//     throw new Error('Missing required params');
//   }
//   // const amount = +amount;
//   yield `Burning ${amount} ALGO from ${from}(ALGO) to ${to}(NEAR)`;
//   yield 'fake burn success';
//   return;
// }

async function bridge_txn_maker(
  from: addr,
  to: addr,
  amount: number,
  hash: TxID,
  txType: TxType
): Promise<void> {
  log(`Making ${txType} transaction of ${amount} from ${from} to ${to}`);
  if (txType == 'mint') {
    let indexer = algorandIndexer;
    await indexer.confirm_tx(hash);
  }
  return;
  // check indexer with hash
}

/* general helper */

const sleep = (milliseconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

/* Tmp helper */

function* fakeConfirmTx(hash: TxID): Generator<boolean> {
  console.log('hash : ', hash); // DEV_LOG_TO_REMOVE

  yield false;
  sleep(500);
  yield false;
  sleep(500);
  yield false;
  sleep(500);
  yield true;
  return;
}

class algorandIndexer {
  static *confirm_tx(hash: TxID): Generator<boolean> {
    yield* fakeConfirmTx(hash);
    return;
  }
}
class nearIndexer {
  static *confirm_tx(hash: TxID): Generator<boolean> {
    yield* fakeConfirmTx(hash);
    return;
  }
}
