import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = `file://${path.join(__dirname, 'public', 'template-3x4.html')}`;

const browser = await puppeteer.launch();
const page = await browser.newPage();

await page.setViewport({
  width: 1080,
  height: 1440,
  deviceScaleFactor: 2,
});

await page.goto(htmlPath, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 300));

await page.screenshot({
  path: path.join(__dirname, 'public', 'template-3x4-4k.png'),
  clip: { x: 0, y: 0, width: 1080, height: 1440 },
});

await browser.close();
console.log('Screenshot saved to public/template-3x4-4k.png');
