import { blob } from 'stream/consumers';
import { BlockchainName, BridgeTxStatus, type BridgeTxInfo } from '..';
import { ENV } from './dotenv';
import { BridgeError, ERRORS } from './errors';
import { z } from 'zod';

export { dbItemToBridgeTxInfo, goNearToAtom };

// param validation and formatting

const dbItemToBridgeTxInfo = (
  dbItem: any,
  extra: {
    fromBlockchain: BlockchainName;
    toBlockchain: BlockchainName;
  }
): BridgeTxInfo => {
  const bridgeTx: BridgeTxInfo = {
    amount: BigInt(dbItem.amount),
    dbId: dbItem.id,
    fromAddr: dbItem.near_address,
    fromBlockchain: extra.fromBlockchain,
    fromTxId: dbItem.near_tx_hash,
    timestamp: BigInt(dbItem.create_time),
    toAddr: dbItem.algorand_address,
    toBlockchain: extra.toBlockchain,
    toTxId: dbItem.algo_txn_id,
    txStatus: dbItem.request_status,
  };
  return bridgeTx;
};

// goNear related
function goNearToAtom(goNearPlain: string): string {
  // TODO: l10n: this only converts 1,234,567.0123456789 to 12345670123456789
  // TODO: l10n: and won't work for separators like 123_4567.0123456789 nor 1.234.567,0123456789
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
  return trimLeadingZeroes(
    wholePart + fracPart.padEnd(ENV.GO_NEAR_DECIMALS, '0')
  );
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
