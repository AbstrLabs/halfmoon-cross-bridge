export {
  type AlgoAddr,
  type AlgoTxnId,
  type AlgoTxnParam,
  type BurnApiParam,
  type MintApiParam,
  type NearAddr,
  type NearTxnId,
  type NearTxnParam,
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
import { TxnParam, TxnType } from '../blockchain';

type MintApiParam = z.infer<typeof mintApiParamParser>;
type BurnApiParam = z.infer<typeof burnApiParamParser>;

type AlgoTxnParam = z.infer<typeof algoTxnParamParser>;
type NearTxnParam = z.infer<typeof nearTxnParamParser>;

type AlgoAddr = z.infer<typeof algoAddr>;
type NearAddr = z.infer<typeof nearAddr>;

type NearTxnId = z.infer<typeof nearTxnId>;
type AlgoTxnId = z.infer<typeof algoTxnId>;
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
  txnId: nearTxnId,
});
const burnApiParamParser = z.object({
  amount: parsableAmount,
  from: algoAddr,
  to: nearAddr,
  txnId: nearTxnId,
});

const algoTxnParamParser = z.object({
  atomAmount: z.bigint(), // TODO: should add a gt 1e+10 check (1 fixed cost)
  fromAddr: algoAddr,
  toAddr: algoAddr,
  txnId: algoTxnId,
});
const nearTxnParamParser = z.object({
  atomAmount: z.bigint(), // TODO: should add a gt 1e+10 check (1 fixed cost)
  fromAddr: nearAddr,
  toAddr: nearAddr,
  txnId: nearTxnId,
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
  txnParam: TxnParam,
  txnType: TxnType,
  timestamp: bigint
): BridgeTxnInfo {
  const { fromAddr, toAddr, atomAmount, txnId } = txnParam;
  var fromBlockchain: BlockchainName, toBlockchain: BlockchainName;

  if (txnType === TxnType.MINT) {
    fromBlockchain = BlockchainName.NEAR;
    toBlockchain = BlockchainName.ALGO;
  } else if (txnType === TxnType.BURN) {
    fromBlockchain = BlockchainName.ALGO;
    toBlockchain = BlockchainName.NEAR;
  } else {
    throw new BridgeError(ERRORS.INTERNAL.UNKNOWN_TX_TYPE, {
      txnType: txnType,
    });
  }

  const bridgeTxnInfo: BridgeTxnInfo = {
    dbId: undefined,
    atomAmount,
    timestamp,
    fromAddr,
    fromBlockchain,
    fromTxnId: txnId,
    toAddr,
    toBlockchain,
    toTxnId: undefined,
    txnStatus: BridgeTxnStatus.NOT_STARTED,
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
    txnStatus: dbItem.request_status,
  };
  return bridgeTxn;
};

// goNear related
function goNearToAtom(goNearPlain: string | number): bigint {
  // TODO: typing: return value should be a BigInt

  // TODO: l10n: this only converts 1,234,567.0123456789 to 12345670123456789
  // TODO: l10n: and won't work for separators like 123_4567.0123456789 nor 1.234.567,0123456789
  // TODO: l10n: temp-fix: added an regex to make sure that the input is in correct format
  var goNear: string;
  if (typeof goNearPlain === 'number') {
    goNear = goNearPlain.toString();
  } else if (typeof goNearPlain === 'string') {
    goNear = goNearPlain;
  } else {
    throw new BridgeError(ERRORS.INTERNAL.TYPE_ERROR, {
      goNearType: typeof goNearPlain,
    });
  }

  // from https://github.com/near/near-api-js/blob/6f83d39f47624b4223746c0d27d10f78471575f7/src/utils/format.ts#L46-L53
  goNear.replace(/,/g, '').trim(); // remove comma
  const split = goNear.split('.');
  const wholePart = split[0];
  const fracPart = split[1] || ''; // maybe ?? is better?
  if (split.length > 2 || fracPart.length > ENV.GO_NEAR_DECIMALS) {
    throw new BridgeError(ERRORS.INTERNAL.INVALID_GO_NEAR_AMOUNT, {
      goNearPlain: goNear,
    });
  }
  const atomAmount = BigInt(
    trimLeadingZeroes(wholePart + fracPart.padEnd(ENV.GO_NEAR_DECIMALS, '0'))
  );
  logger.debug('goNearToAtom', {
    goNearPlain: goNear,
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

function yoctoNearToAtom(yoctoNear: string | number | bigint): bigint {
  var yNear: string;

  if (typeof yoctoNear === 'number') {
    yNear = yoctoNear.toString();
    if (yNear.includes('.')) {
      throw new BridgeError(ERRORS.INTERNAL.INVALID_YOCTO_NEAR_AMOUNT, {
        yoctoNear: yNear,
      });
    }
  } else if (typeof yoctoNear === 'string') {
    yNear = yoctoNear;
  } else if (typeof yoctoNear === 'bigint') {
    yNear = yoctoNear.toString();
  } else {
    throw new BridgeError(ERRORS.INTERNAL.TYPE_ERROR, {
      goNearType: typeof yoctoNear,
    });
  }

  const nearPlain = utils.format.formatNearAmount(yNear);
  if (nearPlain === null) {
    throw new BridgeError(ERRORS.INTERNAL.INVALID_YOCTO_NEAR_AMOUNT, {
      yNear,
    });
  }
  return goNearToAtom(nearPlain);
}
