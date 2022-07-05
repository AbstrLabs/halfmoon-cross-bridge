| As a           | I want to                        | so that / to / for       |
| -------------- | -------------------------------- | ------------------------ |
| crypto-holder  | store cryptos in one wallet      | for convenience          |
| ETH/BTC-holder | mint ETH to aETH                 | store ETH with aETH      |
| ETH/BTC-holder | store ETH with aETH              | for security             |
| ETH/BTC-holder | retrieve aETH                    | recover asset            |
| ETH-holder     | transact with aETH               | reduce txn cost          |
| BTC-holder     | transact with aBTC               | improve smart contract   |
| crypto-sender  | send cryptos to algorand network | for convenience          |
| crypto-trader  | mint `aToken`                    | trade in algorand AMM    |
| developer      | let my user use `aToken`         | use ASC on other cryptos |
| anonymous      | check some history txn           | trust the company        |
| anonymous      | run a low cost test txn          | trust the company        |
| anonymous      | check service availability       | use the bridge           |
| anonymous      | run mint txn                     | use the bridge           |
| anonymous      | run burn txn                     | use the bridge           |
| anonymous      | create an account                | for convenience          |
| logged-in      | extend anonymous' ability        | for convenience          |
| logged-in      | store some addresses             | for convenience          |
| logged-in      | delete saved address             | for convenience          |
| logged-in      | check my history addresses       | for convenience          |
| logged-in      | log-out                          | for security             |

crypto: any kind of cryptocurrency, its plural form refer to different tokens.
ETH: ethereum, a typical token with high transaction fee.
anonymous: anonymous user.
logged-in: logged-in user.
txn: transaction(s)
mint: user transfer a token `T` and expect to receive another token `S`.
burn: user return a token `S` and expect to receive another token `T`.
