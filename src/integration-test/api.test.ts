import { test, expect } from '@playwright/test';

test('host API server', async ({ request }) => {
  const res = await request.get('./');
  expect(res.ok()).toBeTruthy();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect((await res.json()).API_VERSION == '0.1.1').toBe(true);
});
