# Algorand-NEAR-bridge

Backend of the unidirectional bridge of Algorand <- NEAR with asset `goNEAR`.

## Implementation

1. All amount and fee values are in unit of `10^-{GO_NEAR_DECIMALS}` goNEAR/NEAR, where `env.GO_NEAR_DECIMALS` is the number of decimal places in the goNEAR token (using 10).
2. Using bigint for atomic unit (`atomAmount`) of cryptocurrency after api call.
3. We have 3 units of the NEAR token:
   1. plain NEAR token: 1 of this unit == 1 NEAR == 1 goNEAR.
   2. `atomNEAR`: atomic unit of the goNEAR token. 1 of this unit == 1e-10 goNEAR == 1e-10 NEAR.
   3. `yoctoNEAR`: atomic unit of the NEAR token. 1 of this unit == 1e-24 goNEAR == 1e-24 NEAR. We cannot implement this to `goNEAR`.
   4. Most numbers (and all bigint type) in this repo is in unit of `atomNEAR`.

## Contribute

To run this locally, the `.env` file is required.

### Testing

- Unit test with `yarn test`.
- Test with the API server that we host. (upcoming)
- Test with the API server hosted locally with `yarn dev`, on PORT=4190.
- Test with the frontend that we host. (upcoming)
- Test with the frontend hosted locally with `yarn dev`.

### Developing

1. To run the example frontend (we'll have a better frontend soon), use `yarn dev` command.
2. The pre-push `git hook` will run `yarn jest --onlyChanged` which may contain a mint and a burn transaction. We need transfer back the money (from fee in the MASTER_ACC on each blockchain) when the centralized accounts hold too much transaction fee. (maybe automate this later)

### Code-style

1. we don't use nude `process.env`. Instead, use `ENV` from `src/utils/dotenv.ts`

### Current Structure

This structure has a step-by-step procedure, so we can describe the flow of the project with a list. A graph is not needed.  
I assume you can find which file to add after reading this list.

1. Entrance point `src/main.ts` will setup and run the server.
2. Server `sec/server.ts` will handle API calls and return the result (with response).
   1. handle API calls: verify `ApiCallParam`; call the Mint/Burn function.
3. Mint/Burn function `src/bridge/mint.ts` and `src/bridge/burn.ts` will parse `ApiCallParam` and construct a `BridgeTxn` instance accordingly, then execute the transaction with `BridgeTxn.runWholeBridgeTxn()`.
4. Class `BridgeTxn` in `src/bridge/bridge-txn.ts` will use two single instance of abstract class `Blockchain` to verify received transaction and make a new transaction. And will use a `Database` singleton instance to record the group of related transaction as one entry.
5. Class `AlgorandBlockchain` from `src/blockchain/algorand.ts` and Class `NearBlockchain` from `src/blockchain/near.ts` will have a instance with a static config, and they support all `BridgeTxn` to finish its tasks above.

## New Frontend Requirements

1. Algorand ASA Needs user to Opt In (transfer 0 to oneself, [see detail](https://developer.algorand.org/docs/get-details/asa/#receiving-an-asset))
2. Wallet connection.

## Tests

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

### Unit test

1. Test all functions. (All = 100% coverage.)

## TODO

### send an alert email when

- db cannot connect.
- db cannot query.
