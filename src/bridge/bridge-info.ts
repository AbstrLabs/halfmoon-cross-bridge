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

export { BRIDGE_INFO_MAP };

import { ENV } from '../utils/dotenv';
import { Addr } from '../utils/type';
import { TokenId } from './token-table';

interface BridgeInfo {
  fromToken: TokenId;
  fromMaster: Addr;
  toToken: TokenId;
  toMaster: Addr;
}

const NEAR_goNEAR: BridgeInfo = {
  fromToken: 'NEAR',
  fromMaster: ENV.NEAR_MASTER_ADDR,
  toToken: 'goNEAR',
  toMaster: ENV.ALGO_MASTER_ADDR,
};

const goNEAR_NEAR: BridgeInfo = {
  fromToken: 'goNEAR',
  fromMaster: ENV.ALGO_MASTER_ADDR,
  toToken: 'NEAR',
  toMaster: ENV.NEAR_MASTER_ADDR,
};

const ALGO_wALGO: BridgeInfo = {
  fromToken: 'ALGO',
  fromMaster: ENV.ALGO_MASTER_ADDR, // TODO [wMaster]: create and use new account
  toToken: 'wALGO',
  toMaster: ENV.NEAR_MASTER_ADDR, // TODO [wMaster]: create and use new account
};

const wALGO_ALGO: BridgeInfo = {
  fromToken: 'wALGO',
  fromMaster: ENV.NEAR_MASTER_ADDR, // TODO [wMaster]: create and use new account
  toToken: 'ALGO',
  toMaster: ENV.ALGO_MASTER_ADDR,
};

const BRIDGE_INFO_MAP: Map<[TokenId, TokenId], BridgeInfo> = new Map([
  [['NEAR', 'goNEAR'], NEAR_goNEAR],
  [['goNEAR', 'NEAR'], goNEAR_NEAR],
  [['ALGO', 'wALGO'], ALGO_wALGO],
  [['wALGO', 'ALGO'], wALGO_ALGO],
]);
