# CONTRIBUTE

To run this locally, the `.env` file is required.

## Project structure

- (DEPRECATED) integration-test-related literal templates should be first exported from some file in the integration-test folder, then re-export from the "literal.ts", because Playwright cannot read "node_modules".

## Testing

- Unit test with `yarn test`.
- Test with the API server that we host. (upcoming)
- Test with the API server hosted locally with `yarn dev`, on PORT=4190.
- Test with the frontend that we host. (upcoming)
- Test with the frontend hosted locally with `yarn dev`.

## Developing

1. To run the example frontend (we'll have a better frontend soon), use `yarn dev` command.
2. The pre-push `git hook` will run `yarn jest --onlyChanged` which may contain a mint and a burn transaction. We need transfer back the money (from fee in the MASTER_ACC on each blockchain) when the centralized accounts hold too much transaction fee. (maybe automate this later)

## Code-style

We have a prettier config in "package.json". Here are some rules not included in the prettier config:

1. Don't use nude `process.env`. Import `ENV` from `src/utils/dotenv.ts` instead.

## Structure

<!-- TODO: update this chapter -->

This structure has a step-by-step procedure, so we can describe the flow of the project with a list. A graph is not needed.  
I assume you can find which file to add after reading this list.

1. Entrance point `src/main.ts` will setup and run the server.
2. Server `sec/server.ts` will handle API calls and return the result (with response).
   1. handle API calls: verify `ApiCallParam`; call the Mint/Burn function.
3. Mint/Burn function `src/bridge/mint.ts` and `src/bridge/burn.ts` will parse `ApiCallParam` and construct a `BridgeTxn` instance accordingly, then execute the transaction with `BridgeTxn.runWholeBridgeTxn()`.
4. Class `BridgeTxn` in `src/bridge/bridge-txn.ts` will use two single instance of abstract class `Blockchain` to verify received transaction and make a new transaction. And will use a `Database` singleton instance to record the group of related transaction as one entry.
5. Class `AlgorandBlockchain` from `src/blockchain/algorand.ts` and Class `NearBlockchain` from `src/blockchain/near.ts` will have a instance with a static config, and they support all `BridgeTxn` to finish its tasks above.
