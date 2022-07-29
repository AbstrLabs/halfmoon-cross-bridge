# Algorand-NEAR-bridge

Backend of the unidirectional bridge of Algorand <- NEAR with asset `goNEAR`.

## Usage

0. **IMPORTANT!** Have a `.env` file (it's git-ignored, ask team member to get it).
1. Run `git clone` on this repo and `cd` into the repo root (with ssh `git clone git@github.com:AbstrLabs/Algorand-NEAR-bridge.git && cd Algorand-NEAR-bridge`). Don't forget to put your `.env` file in the root of the repo.
2. Run `yarn install` to install the dependencies.
3. Run `yarn test` first to confirm that the "mint" and "burn" functions are working correctly.
4. Run `yarn dev` to start the server. The server runs on the `PORT` (loaded from `.env` file) is set to `4190` by default.

## Implementation

1. All amount and fee values are in unit of `10^-{GO_NEAR_DECIMALS}` goNEAR/NEAR, where `env.GO_NEAR_DECIMALS` is the number of decimal places in the goNEAR token (using 10).
2. Using bigint for atomic unit (`atomAmount`) of cryptocurrency after api call.
3. There are 3 units of the NEAR token:
   1. plain NEAR token: amount of this unit == 1 NEAR == 1 goNEAR. Usually stored in type `string` or `number`.
   2. `atomNEAR`: atomic unit of the goNEAR token. 1 of this unit == 1e-10 goNEAR == 1e-10 NEAR. Usually stored in type `bigint`.
   3. `yoctoNEAR`: atomic unit of the NEAR token. 1 of this unit == 1e-24 goNEAR == 1e-24 NEAR. We cannot implement this to `goNEAR`. Usually stored in type `string`.
   4. Most numbers (and all bigint type) in this repo is in unit of `atomNEAR`.

## Dev / Contribution

See the [CONTRIBUTE](CONTRIBUTE.md) file.

## TEST

This is part of the feature that we offer.  
See the [TEST](./docs/TEST.md) file.

## TBD

### Terminology

- "Mint" and "burn" are not precise enough. Need a better name.

### send an alert email when

- db cannot connect.
- db cannot query.
- transaction fails to run.
- transaction has error status.
