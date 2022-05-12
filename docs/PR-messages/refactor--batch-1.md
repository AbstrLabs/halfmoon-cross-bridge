This PR completes <https://abstrlabs.atlassian.net/browse/BAN-30>

## Summary

### refactor

- rename
  - BridgeTxnInfo -> BridgeTxn
  - create_time → created_time
  - bridgeTxnHandler -> handleBridgeTxn
  - (BridgeTxn) timestamp-> createdTime
  - all zod types
  - literal -> literals (for zod.literal auto-import)
  - goNearToAtom -> toGoNearAtom
  - (ERRORS)TXN->API, swap API/INTERNAL errId
- typing
  - verify / parse multiple types with zod
    - DbItem
    - Addr
    - TxnId
    - TxnParam
    - ApiParam
  - new DbItem type with zod
  - add a universal parse function
  - new Biginter type
  - bridgeTxn methods
- move files
  - `test-helper` -> `utils/test-helper`
  - `src/blockchain/bridge/*` -> `src/bridge/*`
  - `bridge/bridge-txn-info` -> `bridge/bridge-txn`
- move codes
  - separate `db.ts` from `database/index.ts`
  - all zod types to `utils/type.ts`
  - types with verifying in `src/index.ts` -> `utils/type.ts`
  - all `process.env` uses `ENV`
  - `bridge/bridge-txn-handler` -> `bridge/bridge-txn`
- interface
  - `Blockchain.getTxnStatus()` receives `TxnParam`
  - `Blockchain` subclasses have new constructor with param
  - `_makeAsaTxn` accepts `AlgoTxnParam` and handles errors
  - use `ENV`, drop nude `process.env`
- BridgeTxn
  - take all process from `bridge-txn-handler` with new methods
  - add method `toString()`, `toObject()`, `_checkStatus()`, `_updateTxnStatus()`, `_updateToTxnId()`
  - hide private fields with `#`
  - getters for properties after `_initialize()`
  -
- for ts-node, `NODE_ENV` -> `TS_NODE_ENV`
- connect singleton `db` at start (fix jest setup)
- deprecate `bridge-txn-handler`
- purge `.env`
- some new methods in `database.ts`
- prepare for switch network
- update margin fee and its precision

### Additional

- chore
  - chmod +x pre-push so it can run
  - test only changed files in pre-push
  - fix commit-lint
  - improve winston logger format
- fix
  - add assetId check on goNEAR
  - yoctoNearToAtom with overflow handling and rounding
  - `literals`
