# Algorand-NEAR-bridge

Backend of the unidirectional bridge of Algorand <- NEAR with asset `goNEAR`.

## Usage

0. Have a `.env` file (it's git-ignored). **IMPORTANT!**
1. Run `git clone` on this repo and `cd` into the repo root (with ssh `git clone git@github.com:AbstrLabs/Algorand-NEAR-bridge.git && cd Algorand-NEAR-bridge`). Don't forget to put your `.env` file in the root of the repo.
2. Run `yarn install` to install the dependencies.
3. Run `yarn test` first to confirm that the "mint" and "burn" functions are working correctly.
4. Run `yarn dev` to start the server. `PORT` is set to `4190` by default, you can change it in the `.env` file.

## Implementation

1. All amount and fee values are in unit of `10^-{GO_NEAR_DECIMALS}` goNEAR/NEAR, where `env.GO_NEAR_DECIMALS` is the number of decimal places in the goNEAR token (using 10).
2. Using bigint for atomic unit (`atomAmount`) of cryptocurrency after api call.
3. We have 3 units of the NEAR token:
   1. plain NEAR token: 1 of this unit == 1 NEAR == 1 goNEAR. Usually stored in type `string` or `number`.
   2. `atomNEAR`: atomic unit of the goNEAR token. 1 of this unit == 1e-10 goNEAR == 1e-10 NEAR. Usually stored in type `bigint`.
   3. `yoctoNEAR`: atomic unit of the NEAR token. 1 of this unit == 1e-24 goNEAR == 1e-24 NEAR. We cannot implement this to `goNEAR`. Usually stored in type `string`.
   4. Most numbers (and all bigint type) in this repo is in unit of `atomNEAR`.

## Contribute

See the [CONTRIBUTE](CONTRIBUTE.md) file.

## Tests

| Unit Test  | Integration Test |
| ---------- | ---------------- |
| `.spec.ts` | `test.ts`        |

### Unit test

1. Test all functions. (All = 100% coverage.)

### Integration Tests

1. Create an ASA asset goNEAR on Algorand.

   1. Test: Multiple transfers between two ASA holders.
   2. Test: After every X transactions are completed, the number of escrowed NEARs is the same as the number of goNEARs in circulation.
   3. Test: random monkey test; stress test.

2. The current architecture needs to be done on two chains, so we need two centralized accounts, one on each blockchain.

   1. Test: Amount read from NEAR Indexer is the same amount of NEAR as in the database.
   2. Test: Amount read from Algorand Indexer is the same number of goNEAR as in the database.
   3. Test: The `Escrowed/Issued` rate inside the database = 100%. (or make sure it is greater than a certain number?)

3. Currently the two chains cannot communicate directly, so a backend is needed to handle the requests.

   1. Further test: monitor server health.
   2. Further test: AWS account security.
   3. Further test: network health for AWS.

4. Mint and Burn operations are performed on the backend and do not require smart contracts.

   1. Further Test: whether the monitoring API works correctly.
   2. Unit Test: Mint, correct transfer amount with correct transaction fee.
   3. Unit Test: Burn, correct transfer amount with correct transaction fee.
   4. Unit Test: database CRUD Test.
   5. Test: database table content correctness (TODO).
   6. None.

5. Stability: Operation should be ACID.

   1. Further test: alert function for exceptions.
   2. Further test: manual snapshot to monitor the stability of the database.
   3. Further test: correctness of AWS auto-scaling (with redundancy).
   4. Canceled
   5. Further test: compare the number of the NEAR and goNEAR in database and the state in snapshot; Further test: Database performance in stress test.

6. high performance, with concurrency, to meet the needs of a large number of users operating at the same time.

   1. Further test: stress testing
   2. Further test: whether the snapshot will break the transaction in the stress test.
   3. Further test: Storing memory usage information during stress tests.

7. security: neither the user nor the service provider suffers a major loss in the event of a malicious attack.

   1. I don't know how to do this <!-- TODO -->

## TODO

### Terminology

- "Mint" and "burn" are not precise enough. Need a better name.

### send an alert email when

- db cannot connect.
- db cannot query.
