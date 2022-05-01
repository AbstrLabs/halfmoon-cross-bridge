export {
  type AlgoTxnParam,
  type ApiCallParam,
  type BurnApiParam,
  type MintApiParam,
  type NearTxnParam,
  type TxnParam,
  apiParamToBridgeTxnInfo,
  dbItemToBridgeTxnInfo,
  goNearToAtom,
  parseBurnApiParam,
  parseMintApiParam,
  yoctoNearToAtom,
};

import { BlockchainName, BridgeTxnStatus, type BridgeTxnInfo } from '..';
import { ENV } from './dotenv';
import { BridgeError, ERRORS } from './errors';
import { z } from 'zod';
import { logger } from './logger';
import { utils } from 'near-api-js';
import { TxnType } from '../blockchain';

type MintApiParam = z.infer<typeof mintApiParamParser>;
type BurnApiParam = z.infer<typeof burnApiParamParser>;
type ApiCallParam = MintApiParam | BurnApiParam;

type AlgoTxnParam = z.infer<typeof algoTxnParamParser>;
type NearTxnParam = z.infer<typeof nearTxnParamParser>;
type TxnParam = AlgoTxnParam | NearTxnParam;

// param validation and formatting

const nearAddr = z
  // from https://wallet.testnet.near.org/create
  // cannot start with `-` and `_`
  .string()
  .regex(
    /^[0-9a-z][0-9a-z\-\_]{1,64}.(testnet|mainnet)$/,
    'malformed near address'
  );
const algoAddr = z
  // from https://forum.algorand.org/t/how-is-an-algorands-address-made/960 // no 0,1,8
  .string()
  .regex(/^[2-79A-Z]{58}$/, 'malformed algorand address');
const parsableAmount = z
  .string()
  .regex(/^ *[0-9,]{1,9}\.?[0-9]{0,10} *$/, 'malformed amount address');

const nearTxnId = z.string(); // TODO: unfinished
const algoTxnId = z.string(); // TODO: unfinished

const mintApiParamParser = z.object({
  amount: parsableAmount,
  from: nearAddr,
  to: algoAddr,
  txId: nearTxnId,
});
const burnApiParamParser = z.object({
  amount: parsableAmount,
  from: algoAddr,
  to: nearAddr,
  txId: nearTxnId,
});

const algoTxnParamParser = z.object({
  atomAmount: z.bigint(),
  fromAddr: algoAddr,
  toAddr: algoAddr,
  txId: algoTxnId,
});
const nearTxnParamParser = z.object({
  atomAmount: z.bigint(),
  fromAddr: nearAddr,
  toAddr: nearAddr,
  txId: nearTxnId,
});

function parseMintApiParam(apiParam: MintApiParam): MintApiParam {
  try {
    return mintApiParamParser.parse(apiParam);
  } catch (e) {
    throw new BridgeError(ERRORS.TXN.INVALID_API_PARAM, {
      parseErrorDetail: e,
    });
  }
}

function parseBurnApiParam(apiParam: BurnApiParam): BurnApiParam {
  try {
    return burnApiParamParser.parse(apiParam);
  } catch (e) {
    throw new BridgeError(ERRORS.TXN.INVALID_API_PARAM, {
      parseErrorDetail: e,
    });
  }
}

function apiParamToBridgeTxnInfo(
  txParam: TxnParam,
  txType: TxnType,
  timestamp: bigint
): BridgeTxnInfo {
  const { fromAddr, toAddr, atomAmount, txId } = txParam;
  var fromBlockchain: BlockchainName, toBlockchain: BlockchainName;

  if (txType === TxnType.Mint) {
    fromBlockchain = BlockchainName.NEAR;
    toBlockchain = BlockchainName.ALGO;
  } else if (txType === TxnType.Burn) {
    fromBlockchain = BlockchainName.ALGO;
    toBlockchain = BlockchainName.NEAR;
  } else {
    throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TX_TYPE, { txType: txType });
  }

  const bridgeTxnInfo: BridgeTxnInfo = {
    dbId: undefined,
    atomAmount,
    timestamp,
    fromAddr,
    fromBlockchain,
    fromTxnId: txId,
    toAddr,
    toBlockchain,
    toTxnId: undefined,
    txStatus: BridgeTxnStatus.NOT_STARTED,
  };
  return bridgeTxnInfo;
}

const dbItemToBridgeTxnInfo = (
  dbItem: any,
  extra: {
    fromBlockchain: BlockchainName;
    toBlockchain: BlockchainName;
  }
): BridgeTxnInfo => {
  const bridgeTxn: BridgeTxnInfo = {
    atomAmount: BigInt(dbItem.amount),
    dbId: dbItem.id,
    fromAddr: dbItem.near_address,
    fromBlockchain: extra.fromBlockchain,
    fromTxnId: dbItem.near_tx_hash,
    timestamp: BigInt(dbItem.create_time),
    toAddr: dbItem.algorand_address,
    toBlockchain: extra.toBlockchain,
    toTxnId: dbItem.algo_txn_id,
    txStatus: dbItem.request_status,
  };
  return bridgeTxn;
};

// goNear related
function goNearToAtom(goNearPlain: string): string {
  // TODO: typing: return value should be a BigInt

  // TODO: l10n: this only converts 1,234,567.0123456789 to 12345670123456789
  // TODO: l10n: and won't work for separators like 123_4567.0123456789 nor 1.234.567,0123456789
  // TODO: l10n: temp-fix: added an regex to make sure that the input is in correct format
  // from https://github.com/near/near-api-js/blob/6f83d39f47624b4223746c0d27d10f78471575f7/src/utils/format.ts#L46-L53

  goNearPlain.replace(/,/g, '').trim(); // remove comma
  const split = goNearPlain.split('.');
  const wholePart = split[0];
  const fracPart = split[1] || ''; // maybe ?? is better?
  if (split.length > 2 || fracPart.length > ENV.GO_NEAR_DECIMALS) {
    throw new BridgeError(ERRORS.INTERNAL.INVALID_GO_NEAR_AMOUNT, {
      goNearPlain,
    });
  }
  const atomAmount = trimLeadingZeroes(
    wholePart + fracPart.padEnd(ENV.GO_NEAR_DECIMALS, '0')
  );
  logger.debug('goNearToAtom', {
    goNearPlain,
    wholePart,
    fracPart,
    atomAmount,
  });
  return atomAmount;
}

/**
 * Removes leading zeroes from an input
 * @param value A value that may contain leading zeroes
 * @returns string The value without the leading zeroes
 */
function trimLeadingZeroes(value: string): string {
  // from https://github.com/near/near-api-js/blob/6f83d39f47624b4223746c0d27d10f78471575f7/src/utils/format.ts#L83-L88
  value = value.replace(/^0+/, '');
  if (value === '') {
    return '0';
  }
  return value;
}

function yoctoNearToAtom(yoctoNear: string): bigint {
  const nearPlain = utils.format.formatNearAmount(yoctoNear);
  if (nearPlain === null) {
    throw new BridgeError(ERRORS.INTERNAL.INVALID_YOCTO_NEAR_AMOUNT, {
      yoctoNear,
    });
  }
  return BigInt(goNearToAtom(nearPlain));
}
