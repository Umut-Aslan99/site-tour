import { expect, test, type Page } from '@playwright/test';

const tour = (p: Page) => p.locator('[data-site-tour="demo"]');
const next = (p: Page) => tour(p).getByTestId('tour-next').click();
const title = (p: Page) => tour(p).locator('h2');

test('starts on the first visit, skipping is remembered, the launcher replays it', async ({ page }) => {
  await page.goto('/demo/index.html');
  await expect(title(page)).toHaveText('Willkommen in der Demo-App');
  await expect(page.getByTestId('tour-launcher')).toBeHidden();
  await tour(page).getByTestId('tour-skip').click();
  await expect(tour(page)).toHaveCount(0);
  await page.reload();
  await page.waitForTimeout(500);
  await expect(tour(page)).toHaveCount(0);
  await page.getByTestId('tour-launcher').click();
  await expect(title(page)).toHaveText('Willkommen in der Demo-App');
});

test('everything is blocked except an interactive target', async ({ page }) => {
  await page.goto('/demo/index.html');
  await next(page); // tiles: nothing clickable
  await page.mouse.click(...(await center(page, '#outside')));
  await expect(page.locator('#outside-state')).toHaveText('nicht geklickt');
  await next(page); // "try it": only the target is clickable
  await expect(title(page)).toHaveText('Probieren Sie es aus');
  await page.mouse.click(...(await center(page, '#try')));
  await expect(page.locator('#clicked')).toHaveText('geklickt');
  await page.mouse.click(...(await center(page, '#outside')));
  await expect(page.locator('#outside-state')).toHaveText('nicht geklickt');
});

test('scrolls to far targets, waits for late data, skips missing targets, continues on another page', async ({ page }) => {
  const warnings: string[] = [];
  page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
  await page.goto('/demo/index.html');
  for (let i = 0; i < 3; i++) await next(page);
  await expect(title(page)).toHaveText('Weit unten auf der Seite');
  await expect(page.locator('[data-tour="table"]')).toBeInViewport();
  await next(page);
  await expect(title(page)).toHaveText('Später geladen');
  await next(page);
  await expect(title(page)).toHaveText('Andere Seite');
  await expect(page).toHaveURL(/second\.html$/);
  expect(warnings.join('\n')).toContain('[data-tour="missing"] not found');
  await next(page);
  await tour(page).getByTestId('tour-next').click(); // "Fertig"
  await expect(tour(page)).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('site-tour:demo'))).toBe('done');
});

test('keyboard: arrows move, Escape skips, focus stays in the bubble', async ({ page }) => {
  await page.goto('/demo/index.html');
  await expect(tour(page).getByTestId('tour-next')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(title(page)).toHaveText('Kennzahlen auf einen Blick');
  await page.keyboard.press('ArrowLeft');
  await expect(title(page)).toHaveText('Willkommen in der Demo-App');
  for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.hasAttribute('data-site-tour'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(tour(page)).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('site-tour:demo'))).toBe('skipped');
});

test('the spotlight follows an element that the page replaced', async ({ page }) => {
  await page.goto('/demo/index.html');
  await next(page);
  await page.waitForTimeout(2200); // the demo replaces the tiles after 1.5 s
  const spot = await page.locator('[data-site-tour="demo"]').evaluate((h) => h.shadowRoot!.querySelector('.spot')!.getBoundingClientRect().top);
  const tiles = (await page.locator('[data-tour="tiles"]').boundingBox())!;
  expect(Math.abs(spot - (tiles.y - 8))).toBeLessThan(2);
});

test('a reload in the middle continues at the same step', async ({ page }) => {
  await page.goto('/demo/index.html');
  await next(page);
  await page.reload();
  await expect(title(page)).toHaveText('Kennzahlen auf einen Blick');
});

async function center(page: Page, selector: string): Promise<[number, number]> {
  const box = (await page.locator(selector).boundingBox())!;
  return [box.x + box.width / 2, box.y + box.height / 2];
}
