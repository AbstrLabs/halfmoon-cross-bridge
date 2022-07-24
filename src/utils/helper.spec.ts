import { bigintBips } from './helper';

describe('bigintBips should', () => {
  it('return same value for 10000 bips', () => {
    const bigint = BigInt('1000000000');
    const bips = BigInt('10000');
    const result = bigintBips(bigint, bips);
    expect(result).toBe(bigint);
  });
  it('calculates correctly', () => {
    const bigint = BigInt('1000000000');
    const bips = BigInt(10000 - 20); // 99.8%
    const bigintExpected = BigInt('998000000'); // 1000000000 * 99.8%
    const result = bigintBips(bigint, bips);
    expect(result).toBe(bigintExpected);
  });
});
