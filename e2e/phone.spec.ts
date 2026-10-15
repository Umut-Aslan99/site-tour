import { expect, test } from '@playwright/test';

test('on a phone the bubble is a sheet at the bottom and the target stays visible above it', async ({ page }) => {
  await page.goto('/demo/index.html');
  await page.locator('[data-site-tour="demo"]').getByTestId('tour-next').click();
  const bubble = page.locator('[data-site-tour="demo"] section.bubble');
  await expect(bubble).toHaveClass(/sheet/);
  const sheet = (await bubble.boundingBox())!;
  const target = (await page.locator('[data-tour="tiles"]').boundingBox())!;
  const vh = page.viewportSize()!.height;
  expect(sheet.y + sheet.height).toBeLessThanOrEqual(vh);
  expect(target.y + target.height).toBeLessThanOrEqual(sheet.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
});
