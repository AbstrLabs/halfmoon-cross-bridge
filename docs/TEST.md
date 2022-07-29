## Tests

### Test file name regulation

| Unit Test   | Integration Test |
| ----------- | ---------------- |
| `*.spec.ts` | `*.test.ts`      |

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
