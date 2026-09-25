/* Visual and interaction smoke test for the public premium experience. No Firebase or Hotmart calls. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2] || path.join(root, '..', '..', 'outputs', 'phase25-premium-perception'));
const chrome = process.env.CHROME_BIN || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const mime = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.json':'application/json' };

(async () => {
  fs.mkdirSync(output, { recursive:true });
  const server = http.createServer((request, response) => {
    const relative = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, `.${relative === '/' ? '/index.html' : relative}`);
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    fs.readFile(file, (error, data) => {
      if (error) { response.writeHead(404).end(); return; }
      response.writeHead(200, { 'content-type':mime[path.extname(file)] || 'application/octet-stream' }).end(data);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless:true, executablePath:chrome, args:['--autoplay-policy=no-user-gesture-required'] });
  const rows = [];
  try {
    for (const theme of ['dark','light']) {
      for (const width of [1440,390]) {
        const page = await browser.newPage({ viewport:{ width,height:960 }, deviceScaleFactor:1 });
        await page.addInitScript((value) => localStorage.setItem('emp-theme', value), theme);
        for (const route of ['index.html','pages/planos.html','pages/grade-curricular.html']) {
          const errors = [];
          const capture = (error) => errors.push(String(error));
          page.on('pageerror', capture);
          await page.goto(`${base}/${route}`, { waitUntil:'domcontentloaded' });
          await page.waitForTimeout(250);
          const metrics = await page.evaluate(() => ({
            overflow:document.documentElement.scrollWidth > window.innerWidth + 1,
            brokenImages:[...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src),
            title:document.title
          }));
          assert.equal(metrics.overflow, false, `${route} overflows at ${width}px (${theme})`);
          assert.deepEqual(metrics.brokenImages, [], `${route} has broken images`);
          const relevantErrors = errors.filter((error) => !error.includes('gstatic.com/firebasejs'));
          assert.deepEqual(relevantErrors, [], `${route} has runtime errors`);
          rows.push({ route,width,theme,...metrics });
          page.removeListener('pageerror', capture);
        }

        await page.goto(`${base}/index.html`, { waitUntil:'domcontentloaded' });
        await page.waitForTimeout(250);
        await page.locator('[data-tour-tab="progresso"]').click();
        assert.equal(await page.locator('[data-tour-panel="progresso"]').isVisible(), true);
        await page.locator('[data-sound-mode="finished"]').click();
        assert.equal(await page.locator('[data-sound-mode="finished"]').getAttribute('aria-pressed'), 'true');
        if (theme === 'dark') {
          await page.locator('[data-sound-play]').click();
          await page.waitForTimeout(250);
          assert.match(await page.locator('[data-sound-status]').innerText(), /Ouvindo a finalização/);
          await page.locator('[data-sound-play]').click();
        }
        await page.screenshot({ path:path.join(output,`home-${width}-${theme}.png`), fullPage:true });

        await page.goto(`${base}/pages/planos.html`, { waitUntil:'domcontentloaded' });
        await page.waitForTimeout(250);
        await page.locator('[data-plan-choice="premium"]').click();
        assert.equal(await page.locator('[data-plan-card="premium"]').evaluate((node) => node.classList.contains('is-recommended')), true);
        await page.screenshot({ path:path.join(output,`planos-${width}-${theme}.png`), fullPage:true });

        await page.goto(`${base}/pages/grade-curricular.html`, { waitUntil:'domcontentloaded' });
        await page.waitForTimeout(250);
        assert.equal(await page.locator('.curriculum-map__cycles li').count(), 6);
        await page.screenshot({ path:path.join(output,`grade-${width}-${theme}.png`), fullPage:true });
        await page.close();
      }
    }
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(rows,null,2));
    console.log(`Phase 25 QA passed: ${rows.length} responsive page checks and all premium interactions. Output: ${output}`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
