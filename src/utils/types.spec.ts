import {
  EXAMPLE_ALGO_ADDR,
  EXAMPLE_API_PARAM,
} from '../test/test-helper/test-examples';
import { fullyParseApiParam, parseAlgoAddr } from './type';

describe('type.ts', () => {
  describe('Zod Parsers', () => {
    describe('parseAlgoAddr', () => {
      it('should parse correct Algo Addr', () => {
        const parsedAddr = parseAlgoAddr(EXAMPLE_ALGO_ADDR);
        expect(parsedAddr).toEqual(EXAMPLE_ALGO_ADDR);
      });
    });
    describe('fullyParseApiParam', () => {
      it('should parse correct API param', () => {
        expect(fullyParseApiParam(EXAMPLE_API_PARAM)).toBe(EXAMPLE_API_PARAM);
      });
      it('should reject wrong API param', () => {
        expect(() => {
          const copy = { ...EXAMPLE_API_PARAM };
          // copy.to_id = 3; TS handles this
          copy.to_addr = 'wrong';
          fullyParseApiParam(copy);
        }).toThrow();
      });
    });
  });
});
