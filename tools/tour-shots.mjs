// Dev helper: one screenshot per tour step, taken once the step has settled (not part of any test suite).
// Usage (copied into a project's e2e folder, run in the Playwright container): node tour-shots.mjs <tourId> <steps> <mobileStep> [startPath]
import { chromium, devices } from '@playwright/test';
const [, , id, count, mobileStep, startPath = '/'] = process.argv;
const base = process.env.BASE_URL ?? 'http://localhost:8080';
const b = await chromium.launch();
async function run(ctxOpts, prefix, only) {
  const p = await (await b.newContext(ctxOpts)).newPage();
  await p.goto(`${base}${startPath}${startPath.includes('?') ? '&' : '?'}tour=start`);
  const tour = p.locator(`[data-site-tour="${id}"]`);
  for (let i = 1; i <= Number(count); i++) {
    await tour.locator(`section.bubble[data-step="${i}"]:not(.moving)`).waitFor({ timeout: 15000 });
    await p.waitForTimeout(600);
    if (!only || only.includes(i)) await p.screenshot({ path: `/shots/${prefix}-${i}.png` });
    if (i < Number(count)) await tour.getByTestId('tour-next').click();
  }
}
await run({ viewport: { width: 1366, height: 860 }, locale: 'de-DE' }, `${id}-d`);
await run({ ...devices['Pixel 7'], locale: 'de-DE' }, `${id}-m`, [Number(mobileStep)]);
await b.close();
