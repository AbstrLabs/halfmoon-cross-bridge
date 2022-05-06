# Algorand-NEAR-bridge

## Implementation

1. All amount and fee values are in unit of `10^-{GO_NEAR_DECIMALS}` goNEAR/NEAR, where `env.GO_NEAR_DECIMALS` is the number of decimal places in the goNEAR token (using 10).
2. Using bigint for atomic unit (`atomAmount`) of cryptocurrency after api call.

## Contribute

1. pre-commit hook will run `yarn test` which contains a mint and a burn transaction. Should transfer back the money when the centralized accounts hold too much transaction fee. (maybe automate later)
