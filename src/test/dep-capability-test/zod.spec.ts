import { z } from 'zod';

describe('zod should', () => {
  it('be able to validate a valid object', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const result = schema.parse({
      name: 'John',
      age: 30,
    });
    expect(result).toEqual({
      name: 'John',
      age: 30,
    });
  });
  it('be able to reject an invalid object', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    expect(() => schema.parse({})).toThrow();
  });
  it('remove extra properties', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    const result = schema.parse({
      name: 'John',
      age: 30,
      extra: 'extra',
    });
    expect(result).toEqual({
      name: 'John',
      age: 30,
    });
  });
});
