/**
 * This file is a convenient local variable for token table on RDS.
 * @todo - create token_table on RDS.
 * @todo - move TOKEN_TABLE to constants file.
 */

export type { Token, TokenId };
export { TOKEN_TABLE };
import { BlockchainName } from '..';
import { ENV } from '../utils/dotenv';
import { Addr } from '../utils/type';

interface Token {
  tokenId: TokenId;
  tokenName: string;
  implBlockchain: BlockchainName;
  implMaster: Addr;
  originBlockchain: BlockchainName;
  originMaster: Addr;
}

type TokenId = keyof typeof TOKEN_TABLE;

const goNEAR: Token = {
  tokenId: 'goNEAR',
  tokenName: 'goNEAR',
  implBlockchain: BlockchainName.ALGO,
  implMaster: ENV.ALGO_MASTER_ADDR,
  originBlockchain: BlockchainName.NEAR,
  originMaster: ENV.NEAR_MASTER_ADDR,
};

const wALGO: Token = {
  tokenId: 'wALGO',
  tokenName: 'wALGO',
  implBlockchain: BlockchainName.NEAR,
  implMaster: ENV.NEAR_MASTER_ADDR, // TODO: use another account
  originBlockchain: BlockchainName.ALGO,
  originMaster: ENV.ALGO_MASTER_ADDR, // TODO: use another account
};

// use obj for non-consecutive tokenId
// also preserves the possibility of naming tokens with non-numeric value in the future
const TOKEN_TABLE = { goNEAR, wALGO } as const;

Object.freeze(TOKEN_TABLE);
