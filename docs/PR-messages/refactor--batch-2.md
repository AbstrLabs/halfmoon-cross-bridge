Huge refactor with ESLint strict rules.
<https://github.com/AbstrLabs/Algorand-NEAR-bridge/pull/18>

## Breaking change

- move old API endpoint `/api/mint` to `/algorand-near`
- server stability, no more panic on wrong parameters
- verify incoming transaction before create `BridgeTxn` in DB.

## Refactor

- add and remove some `literals`
- merge `mint()` of `mint.ts` and `burn()` of `burn.ts` and their tests
- add `txnType` to interface `ApiCallParam`
- update and use strict rule of `ESLint`
- add a `GET` method to guide users to use `POST`
- remove `BridgeTxn.{getTxnType(),_inferTxnType()}`
- split `server.ts` file
- rename `ApiCallParam.txnType` to `ApiCallParam.type`
