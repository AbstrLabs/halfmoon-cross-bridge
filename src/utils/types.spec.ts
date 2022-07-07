import { EXAMPLE_API_PARAM } from '../test/test-helper/test-examples';
import { fullyParseApiParam } from './type';

describe('type.ts', () => {
  describe('fullyParseApiParam', () => {
    it('should parse correct API param', () => {
      expect(() => {
        fullyParseApiParam(EXAMPLE_API_PARAM);
      }).not.toThrow();
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
