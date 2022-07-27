/**
 * Zod parser (verifier) and the derived Typescript Types
 * All Zod related types should be here.
 */

// Use Zod.union instead of TS union

export type { Biginter, Stringer };

export { zBiginter, parseBigInt, parseWithZod };

export { ApiCallParam } from '../../common/src/type/api';
import { z } from 'zod';
import { BridgeError, ErrorTemplate, ERRORS } from '../bridge-error';
import { logger } from '../log/logger'; // log-template will cause circular reference

/* NON-ZOD TYPES */

interface Stringer {
  toString(): string;
}

/* ZOD TYPES (WITH PARSER) */

/**
 * Parse (verify) the given object with the given Zod schema.
 * If the parsing fails, throws a {@link BridgeError} with the given {@link ErrorTemplate}.
 *
 * @typeParam T - Type of the object to parse.
 * @typeParam U - Type of the ZodType.
 * @param zodShaped - Zod shaped object to parse.
 * @param zodParser - Zod parser to use.
 * @param errorTemplate - Error template to use.
 * @returns - same zodShaped as {@link zodShaped}.
 */
function parseWithZod<T extends z.infer<U>, U extends z.ZodType>(
  zodShaped: T,
  zodParser: U,
  errorTemplate: ErrorTemplate
): T {
  if (typeof zodShaped === 'bigint') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/restrict-template-expressions
    logger.silly(`[ZOD]: parsingDbItem: ${zodShaped.toString()}`);
  } else {
    logger.silly(`[ZOD]: parsingDbItem: ${JSON.stringify(zodShaped)}`);
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return zodParser.parse(zodShaped) as T;
  } catch (err) {
    logger.error(err);
    throw new BridgeError(errorTemplate, {
      parsing: zodShaped,
      parseErrorDetail: err,
    });
  }
}

/* Zod to Typescript */
// Order of these is same as they are used in the txn process.
// Same order as below zTypeName part

/* COMMONLY USED */
type Biginter = z.infer<typeof zBiginter>;

const zBiginter =
  // can convert to bigint without loss of precision
  z.union([
    z.string().regex(/^[1-9][0-9]{0,18}$/),
    // TODO: actually should remove "0" because minting/ burning 0 makes no sense
    z.literal('0'),
    z.number().int(),
    z.bigint(),
  ]);

/* BLOCKCHAIN SPECIFIC */

/* Class BridgeTxn */

function parseBiginter(biginter: Biginter): Biginter {
  return parseWithZod(biginter, zBiginter, ERRORS.INTERNAL.TYPE_ERR_BIGINT);
}
function parseBigInt(biginter: Biginter): bigint {
  return BigInt(parseBiginter(biginter));
}
/* PARSER */
