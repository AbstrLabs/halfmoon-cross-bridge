/**
 * This file is a convenient local variable for token table on RDS.
 * @todo - create token_table on RDS.
 * @todo - move TOKEN_TABLE to constants file.
 */

export type { Token, TokenId };
export { TOKEN_TABLE };
import { BlockchainName } from '..';

interface Token {
  tokenId: TokenId;
  tokenName: string;
  implBlockchain: BlockchainName; //   should we use toBlockchainName   for the consistency?
  originBlockchain: BlockchainName; // should we use fromBlockchainName for the consistency?
}

type TokenId = keyof typeof TOKEN_TABLE;

const ALGO: Token = {
  tokenId: 0,
  tokenName: 'ALGO',
  implBlockchain: BlockchainName.ALGO, // note here is different than toBlockchainName
  originBlockchain: BlockchainName.ALGO,
};

const NEAR: Token = {
  tokenId: 1,
  tokenName: 'NEAR',
  implBlockchain: BlockchainName.NEAR, // note here is different than toBlockchainName
  originBlockchain: BlockchainName.NEAR,
};

const goNEAR: Token = {
  tokenId: 2,
  tokenName: 'GO_NEAR',
  implBlockchain: BlockchainName.NEAR, // note here is different than toBlockchainName
  originBlockchain: BlockchainName.ALGO, // how TF does copilot predict this
};

// use obj for non-consecutive tokenId
// also preserves the possibility of naming tokens with non-numeric value in the future
const TOKEN_TABLE = { 0: ALGO, 1: NEAR, 2: goNEAR } as const;

Object.freeze(TOKEN_TABLE);
