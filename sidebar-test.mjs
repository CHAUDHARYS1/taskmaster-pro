import { chromium } from 'C:/tmp/node_modules/playwright-core/index.mjs';
const CHROME = 'C:/Users/shita/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe';
const OUT = 'C:/Users/shita/OneDrive/Documents/Apps/taskmaster-pro/';

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu']
});
const page = await browser.newPage();
await page.setViewportSize({ width: 1400, height: 900 });
await page.goto('http://localhost:5179/login', { waitUntil: 'networkidle' });
await page.fill('input[type="email"]', 'shitalchau10@gmail.com');
await page.fill('input[type="password"]', 'Shital1998@');
await page.click('button[type="submit"]');
await page.waitForTimeout(5000);
console.log('URL after login:', page.url());
await page.screenshot({ path: OUT + 'ss-01-board.png' });
const sw = await page.evaluate(() => Math.round(document.querySelector('.sidebar')?.getBoundingClientRect().width ?? -1));
console.log('Sidebar width (expanded):', sw);
const btn = page.locator('.sidebar-collapse-btn');
const n = await btn.count();
console.log('Collapse button count:', n);
if (n > 0) {
  await btn.click();
  await page.waitForTimeout(400);
  const cw = await page.evaluate(() => Math.round(document.querySelector('.sidebar').getBoundingClientRect().width));
  console.log('Sidebar width (collapsed):', cw);
  await page.screenshot({ path: OUT + 'ss-02-collapsed.png' });
  await btn.click();
  await page.waitForTimeout(400);
  const ew = await page.evaluate(() => Math.round(document.querySelector('.sidebar').getBoundingClientRect().width));
  console.log('Sidebar width (expanded again):', ew);
  await page.screenshot({ path: OUT + 'ss-03-expanded.png' });
}
await browser.close();
