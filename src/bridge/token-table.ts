/**
 * This file is a convenient local variable for token table on RDS.
 * @todo - create token_table on RDS.
 * @todo - move TOKEN_TABLE to constants file.
 */

export type { Token };

export { TOKEN_TABLE };
import { BlockchainName } from '..';
import { ENV } from '../utils/dotenv';
import { TokenId } from '../utils/shared-types';
import { Addr } from '../utils/type';

interface TokenBase {
  tokenId: TokenId; // our way to call it, usually same as tokenName
  tokenName: string; // this is its real name
}

interface NativeToken extends TokenBase {
  implBlockchain: BlockchainName;
  // originBlockchain is the same as implBlockchain
  // master address is not needed here.
}

/* NATIVE TOKENS */

const ALGO: NativeToken = {
  tokenId: TokenId.ALGO,
  tokenName: 'ALGO',
  implBlockchain: BlockchainName.ALGO,
};

const NEAR: NativeToken = {
  tokenId: TokenId.NEAR,
  tokenName: 'NEAR',
  implBlockchain: BlockchainName.NEAR,
};

/* ASSET TOKENS */

/**
 * The abstract assets created by us, AbstrLabs.
 */
interface AssetToken extends TokenBase {
  implBlockchain: BlockchainName;
  implMaster: Addr;
  originBlockchain: BlockchainName;
  originMaster: Addr;
  // These two master addresses are stored here to check the
  // consistence between issuance and collateral assets.
}

type Token = NativeToken | AssetToken;

const goNEAR: AssetToken = {
  tokenId: TokenId.goNEAR,
  tokenName: 'goNEAR',
  implBlockchain: BlockchainName.ALGO,
  implMaster: ENV.ALGO_MASTER_ADDR,
  originBlockchain: BlockchainName.NEAR,
  originMaster: ENV.NEAR_MASTER_ADDR,
};

const wALGO: AssetToken = {
  tokenId: TokenId.wALGO,
  tokenName: 'wALGO',
  implBlockchain: BlockchainName.NEAR,
  implMaster: ENV.NEAR_MASTER_ADDR, // TODO [wMaster]: create and use new account
  originBlockchain: BlockchainName.ALGO,
  originMaster: ENV.ALGO_MASTER_ADDR, // TODO [wMaster]: create and use new account
};

// use obj for non-consecutive tokenId
// also preserves the possibility of naming tokens with non-numeric value in the future
// Record<T, Token> is not supported, see https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type
const TOKEN_TABLE: Record<TokenId, Token> = {
  ALGO,
  NEAR,
  goNEAR,
  wALGO,
} as const;

Object.freeze(TOKEN_TABLE);
