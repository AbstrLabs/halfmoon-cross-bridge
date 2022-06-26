import { test, expect } from '@playwright/test';

// test('basic tests', () => {
test('internet connection', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  const title = page.locator('.navbar__inner .navbar__title');
  await expect(title).toHaveText('Playwright');
});
test('near explorer connection', async ({ page }) => {
  const exampleNearTxnId = '8mdZck4aC7UCNsM86W7fTqi8P9r1upw8vtoFscqJwgC7'; // TODO: use temp string

  const url = `https://explorer.testnet.near.org/transactions/${exampleNearTxnId}`;
  await page.goto(url);
  const signer = page.locator(
    '.col-md-5 .c-CardCellText-eLcwWo .c-AccountLinkWrapper-dbzzBd'
  );
  const receiver = page.locator(
    '.col-md-4 .c-CardCellText-eLcwWo .c-AccountLinkWrapper-dbzzBd'
  );
  await expect(signer).toHaveText('abstrlabs-test.testnet');
  await expect(receiver).toHaveText('abstrlabs.testnet');
});
// });
