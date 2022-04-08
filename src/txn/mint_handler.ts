import { type algoAddr, type nearAddr } from '.';
export { mint };

function* mint(
  from: nearAddr,
  to: algoAddr,
  amount: number
): Generator<string> {
  if (!from || !to || !amount) {
    throw new Error('Missing required params');
  }
  // const amount = +amount;
  yield `Minting ${amount} NEAR from ${from}(NEAR) to ${to}(ALGO)`;
  yield 'fake mint success';
  return;
}
