/**
 * This file stores the config of all used ASA: Algorand Standard Asset(s)
 */

export { type AsaConfig, type NoParamAsaConfig, noParamGoNearConfig };

import { SuggestedParams } from 'algosdk';
import { NearAddr } from '../../common/src/type/blockchain';

import { ENV } from '../env';

interface AsaConfig {
  from: string;
  assetName: string;
  decimals: number; // uint
  total: number | bigint; // uint
  unitName: string;
  assetURL: string;
  suggestedParams: SuggestedParams;
  note?: Uint8Array;
  manager?: NearAddr;
  reserve?: NearAddr;
  freeze?: NearAddr;
  clawback?: NearAddr;
  defaultFrozen: boolean;
  assetId?: number; // uint
}
type NoParamAsaConfig = Omit<AsaConfig, 'suggestedParams'>;

const noParamGoNearConfig: NoParamAsaConfig = {
  // this is the current test goNEAR with id 83251085 on testnet
  from: ENV.ALGO_MASTER_ADDR,
  assetName: 'goNEAR',
  decimals: ENV.GO_NEAR_DECIMALS,
  total: BigInt(ENV.NEAR_TOTAL) * BigInt(10 ** ENV.GO_NEAR_DECIMALS),
  // fixed: JS gives  BigInt(10 ** (9 + 10)) = 10000000000000000000n
  // fixed: JS gives  BigInt(10 ** (9 + 24)) ==> 999999999999999945575230987042816n
  unitName: 'goNEAR',
  assetURL: '',
  note: undefined,
  manager: undefined,
  reserve: undefined,
  freeze: undefined,
  clawback: undefined,
  defaultFrozen: false,
  assetId: undefined,
};
