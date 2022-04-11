export { type AsaConfig, type NoParamAsaConfig, noParamGoNearConfig };

import { SuggestedParams } from 'algosdk';
import { nearAddr } from '../../blockchain';
import { ENV } from '../dotenv';

interface AsaConfig {
  from: string;
  assetName: string;
  decimals: number; // uint
  total: number | bigint; // uint
  unitName: string;
  assetURL: string;
  suggestedParams: SuggestedParams;
  note?: Uint8Array;
  manager?: nearAddr;
  reserve?: nearAddr;
  freeze?: nearAddr;
  clawback?: nearAddr;
  defaultFrozen: boolean;
  assetId?: number; // uint
}
type NoParamAsaConfig = Omit<AsaConfig, 'suggestedParams'>;

const noParamGoNearConfig: NoParamAsaConfig = {
  from: ENV.ALGO_MASTER_ADDR,
  assetName: 'goNEAR',
  decimals: 10, // 1 atomic goNEAR = 10^14 yoctoNEAR
  total: BigInt(10 ** (9 + 10)), // NEAR total supply 1 billion.
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
