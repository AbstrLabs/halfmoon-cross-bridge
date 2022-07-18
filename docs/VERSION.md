version history

## 0.1

First hosted stable release.
Using API endpoint <http://api.halfmooncross.com/algorand-near/> and POST body as

```typescript
type PostBody =
  | {
      type: 'MINT';
      amount: string;
      from: string;
      to: string;
      txnId: string;
    }
  | {
      type: 'BURN';
      amount: string;
      from: string;
      to: string;
      txnId: string;
    };
```

## 0.2 (released, not yet applied)

- In the new version, server will have two workers `ApiWorker` and `BridgeWorker`, which both are started on the server run. [See the design pattern](./design-pattern.drawio.svg)
- Update new API endpoint <http://api.halfmooncross.com/algorand-near/> to receive both `GET` and `POST` requests.
  - The `GET` request is used to query the current state of the transaction. Server responds with a JSON of type `BridgeTxnSafeObj`.
  - The `POST` request is used to submit a new transaction. Server responds with a JSON of type `PostReturn`.
  - See their body/param and respond in the `WELCOME_JSON` shown on <https://api.halfmooncross.com> or locally on <http://localhost:4190>

### TBD

- Maybe move the API endpoint from `api.halfmooncross.com/algorand-near` to `api.halfmooncross.com/transaction` or `api.halfmooncross.com/txn` since we are already using the `TokenId` instead of `TxnType`.
