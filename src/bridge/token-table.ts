/**
 * This file is a convenient local variable for token table on RDS.
 * @todo - create token_table on RDS.
 */

export { type Token };
import { BlockchainName } from '..';

interface Token {
  tokenId: number;
  tokenName: string;
  implBlockchain: BlockchainName; //   should we use toBlockchainName   for the consistency?
  originBlockchain: BlockchainName; // should we use fromBlockchainName for the consistency?
}

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

const TOKEN_TABLE = { 0: ALGO, 1: NEAR, 2: goNEAR }; // use obj for non-consecutive tokenId

Object.freeze(TOKEN_TABLE);
