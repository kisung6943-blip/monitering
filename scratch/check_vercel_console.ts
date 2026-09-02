import puppeteer from 'puppeteer';

async function checkConsole() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));
  
  console.log('Navigating to https://monitering.vercel.app...');
  await page.goto('https://monitering.vercel.app', { waitUntil: 'networkidle0', timeout: 30000 });
  
  const content = await page.content();
  console.log('PAGE CONTENT LENGTH:', content.length);
  console.log('DOM ROOT INNERHTML:', await page.evaluate(() => document.getElementById('root')?.innerHTML));
  
  await browser.close();
}

checkConsole().catch(err => console.error('SCRIPT ERROR:', err));
