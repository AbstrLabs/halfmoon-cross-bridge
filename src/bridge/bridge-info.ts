/**
 * A bridge info uniquely defines how to handle a transaction.
 * It's used in the API Parameter so the server would know the exact steps to take.
 *
 * Here we can also extend bridge to more generic swap.
 *
 * ## Design
 *
 * This describes better than only "MINT","BURN".
 * "goNEAR_NEAR" means the old "BURN" action. (Better than "goNEAR_NEAR")
 */

export { BRIDGE_INFO_MAP, getBridgeInfo };

import { ENV } from '../utils/dotenv';
import { BridgeError, ERRORS } from '../utils/errors';
import { TokenId } from '../utils/type/shared-types/token';
import { Addr } from '../utils/type/type';

interface BridgeInfo {
  fromToken: TokenId;
  fromMaster: Addr;
  toToken: TokenId;
  toMaster: Addr;
  fixedFee: number;
  marginBips: number;
  // TODO: conversion method. now only toGoNearAtom
}

const NEAR_goNEAR: BridgeInfo = {
  fromToken: TokenId.NEAR,
  fromMaster: ENV.NEAR_MASTER_ADDR,
  toToken: TokenId.goNEAR,
  toMaster: ENV.ALGO_MASTER_ADDR,
  fixedFee: ENV.MINT_FIX_FEE,
  marginBips: ENV.MINT_MARGIN_FEE_BIPS,
};

const goNEAR_NEAR: BridgeInfo = {
  fromToken: TokenId.goNEAR,
  fromMaster: ENV.ALGO_MASTER_ADDR,
  toToken: TokenId.NEAR,
  toMaster: ENV.NEAR_MASTER_ADDR,
  fixedFee: ENV.BURN_FIX_FEE,
  marginBips: ENV.BURN_MARGIN_FEE_BIPS,
};

const ALGO_wALGO: BridgeInfo = {
  fromToken: TokenId.ALGO,
  fromMaster: ENV.ALGO_MASTER_ADDR, // TODO [wMaster]: create and use new account
  toToken: TokenId.wALGO,
  toMaster: ENV.NEAR_MASTER_ADDR, // TODO [wMaster]: create and use new account
  fixedFee: ENV.MINT_FIX_FEE,
  marginBips: ENV.MINT_MARGIN_FEE_BIPS,
};

const wALGO_ALGO: BridgeInfo = {
  fromToken: TokenId.wALGO,
  fromMaster: ENV.NEAR_MASTER_ADDR, // TODO [wMaster]: create and use new account
  toToken: TokenId.ALGO,
  toMaster: ENV.ALGO_MASTER_ADDR, // TODO [wMaster]: create and use new account
  fixedFee: ENV.BURN_FIX_FEE,
  marginBips: ENV.BURN_MARGIN_FEE_BIPS,
};

// JS Map will not work since [] != [].
// const BRIDGE_INFO_MAP: Map<[TokenId, TokenId], BridgeInfo> = new Map([
//   [[TokenId.NEAR, TokenId.goNEAR], NEAR_goNEAR],
//   [[TokenId.goNEAR, TokenId.NEAR], goNEAR_NEAR],
// ]);

type BridgeInfoMap = Record<TokenId, Partial<Record<TokenId, BridgeInfo>>>;

// TODO: Maybe make it a Class with get method, returning a defined value / throw error.
const BRIDGE_INFO_MAP: BridgeInfoMap = {
  [TokenId.NEAR]: {
    [TokenId.goNEAR]: NEAR_goNEAR,
  },
  [TokenId.goNEAR]: {
    [TokenId.NEAR]: goNEAR_NEAR,
  },
  [TokenId.ALGO]: {
    [TokenId.wALGO]: ALGO_wALGO,
  },
  [TokenId.wALGO]: {
    [TokenId.ALGO]: wALGO_ALGO,
  },
}; // as const;

function getBridgeInfo(fromToken: TokenId, toToken: TokenId): BridgeInfo {
  // help TS to get infer right types
  const fromTree = BRIDGE_INFO_MAP[fromToken];
  if (!(toToken in fromTree)) {
    throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
      true_message: `No bridge info found for ${fromToken}`,
      at: 'bridge-info :getBridgeInfo',
    });
  }
  const bridgeInfo = fromTree[toToken];
  if (bridgeInfo === undefined) {
    throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TXN_TYPE, {
      true_message: `No bridge info found for ${fromToken} -> ${toToken}`,
      at: 'bridge-info :getBridgeInfo',
    });
  }

  return bridgeInfo;
}
