/**
 * This file is a convenient local variable for token table on RDS.
 * @todo - create token_table on RDS.
 */

export type { Token };

export { TOKEN_TABLE, getTokenImplBlockchain };
import { BlockchainName } from '..';
import { BLOCKCHAIN_MAP } from '../blockchain';
import { Blockchain } from '../blockchain/abstract-base';
import { ENV } from '../utils/env';
import { TokenId } from '../common/src/type/token';
import { Addr } from '../utils/type/type';

interface TokenBase {
  tokenId: TokenId; // our way to call it, usually same as tokenName
  tokenName: string; // this is its real name
  assetId: number; // Asset ID on blockchains. 0 = native token; -1 = not implemented.
}

interface NativeToken extends TokenBase {
  implBlockchain: BlockchainName;
  assetId: 0;
  // originBlockchain is the same as implBlockchain
  // master address is not needed here.
}

/* NATIVE TOKENS */

const ALGO: NativeToken = {
  tokenId: TokenId.ALGO,
  tokenName: 'ALGO',
  implBlockchain: BlockchainName.ALGO,
  assetId: 0,
};

const NEAR: NativeToken = {
  tokenId: TokenId.NEAR,
  tokenName: 'NEAR',
  implBlockchain: BlockchainName.NEAR,
  assetId: 0,
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
  assetId: ENV.TEST_NET_GO_NEAR_ASSET_ID,
};

const wALGO: AssetToken = {
  tokenId: TokenId.wALGO,
  tokenName: 'wALGO',
  implBlockchain: BlockchainName.NEAR,
  implMaster: ENV.NEAR_MASTER_ADDR, // TODO [wMaster]: create and use new account
  originBlockchain: BlockchainName.ALGO,
  originMaster: ENV.ALGO_MASTER_ADDR, // TODO [wMaster]: create and use new account
  assetId: -1,
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

const getTokenImplBlockchain = (tokenId: TokenId): Blockchain => {
  const token = TOKEN_TABLE[tokenId];
  return BLOCKCHAIN_MAP[token.implBlockchain];
};

Object.freeze(TOKEN_TABLE);
