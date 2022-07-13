export type { ApiCallParam };
import { TokenId } from './token';
import { Addr, ApiAmount, TxnId } from '../type';

// new API Call Param, not in docs yet.
// removed "type", its unclear when we have more than one token.
// using snake_case instead of camelCase or spinal-case because youtube uses it.
// this interface is for displaying purpose only, we may not use it in the code.
// TODO: Zod z.infer<typeof zApiCallParam>;
interface ApiCallParam {
  amount: ApiAmount;
  txn_id: TxnId;
  from_addr: Addr;
  from_token: TokenId; // token_id
  to_addr: Addr;
  to_token: TokenId; // token_id
}
