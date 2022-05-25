version history

## 0.1

First hosted stable release.
Using API endpoint <http://54.226.43.31/algorand-near/> and POST body as

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
