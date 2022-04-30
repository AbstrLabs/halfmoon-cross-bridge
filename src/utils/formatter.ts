export { dbItemToBridgeTxInfo, goNearToAtom, parseMintApiInfo };

import { BlockchainName, BridgeTxStatus, type BridgeTxInfo } from '..';
import { ENV } from './dotenv';
import { BridgeError, ERRORS } from './errors';
import { z } from 'zod';

type MintApiTxInfo = z.infer<typeof mintApiInfoParser>;

// param validation and formatting

const nearAddr = z
  // from https://wallet.testnet.near.org/create
  // cannot start with `-` and `_`
  .string()
  .regex(
    /^[0-9a-z][0-9a-z\-\_]{1,64}.(testnet|mainnet)$/,
    'misformed near address'
  );
const algoAddr = z
  .string()
  .regex(/^[2-79A-Z]{58}$/, 'misformed algorand address');
const parsableAmount = z
  .string()
  .regex(/^ *[0-9,]{1,9}\.?[0-9]{0,10} *$/, 'misformed amount address');

const nearTxId = z.string(); // TODO: unfinished
const algoTxId = z.string(); // TODO: unfinished

// from https://forum.algorand.org/t/how-is-an-algorands-address-made/960
// no 0,1,8

const mintApiInfoParser = z.object({
  amount: parsableAmount,
  from: nearAddr,
  to: algoAddr, // algorand address
  txId: nearTxId,
});
const burnApiInfoParser = z.object({
  amount: parsableAmount,
  from: nearAddr,
  to: algoAddr, // algorand address
  txId: nearTxId,
});

function parseMintApiInfo(apiInfo: MintApiTxInfo) {
  return mintApiInfoParser.parse(apiInfo);
}

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
