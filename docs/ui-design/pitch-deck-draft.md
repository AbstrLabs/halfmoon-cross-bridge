## Bridge

We are currently working on an extensible bridge. On this bridge, we can exchange things like ETH(ethereum) to another token `aETH` with price pegged to `ETH`. (by issuing slightly less `aETH` than the `ETH` we are holding). With `aETH`, users can access a much cheaper way to make transactions, and to call smart contracts not on `ETH` blockchain.
The bridge is currently centralized and can be easily extend to more tokens. We currently have a `NEAR` -> `aNEAR`(ALGO) bridge, but we are working on a `ALGO` -> `wALGO`(NEAR) bridge and expect to finish it soon.

## Pool

Later on, with more tradable tokens included in our bridge project. We can extend our bridge to an pool to swap between these tokens issued by us. Instead of swap only `ETH` with `aETH` 1:1, users are now able to swap and `aETH` with `aBTC` like 20:1. Since everything happens on a low-cost blockchain, the swapping fee can drop dramatically.

## Exchange

Next step we are going to make is an exchange (decentralized with ZKP). After the pool is approved by users, we can exchange all our assets like `aETH`, `aBTC` with a stablecoin `aUSD`.
Moreover, beside of the cryptocurrencies, later we can also have more stablecoins pegged to other currency, since our current ZKP functionality already allows us to publish prices of currencies like JPY/USD on blockchain. With the full implementation, our users can purchase `BTC` with `aJPY` directly.
