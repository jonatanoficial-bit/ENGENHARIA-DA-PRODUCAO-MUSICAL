/* Optional local visual smoke test. Run with Playwright available in NODE_PATH. No Firebase writes or login. */
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2] || path.join(root, '..', '..', 'outputs', 'phase23-visual-qa'));
const chrome = process.env.CHROME_BIN;
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.json':'application/json' };

async function main() {
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
  const address = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless:true, ...(chrome ? { executablePath:chrome } : {}) });
  const rows = [];
  try {
    const pages = ['index.html','pages/login.html','pages/planos.html','aluno/index.html','aluno/boletim.html','aluno/perfil.html','professor/index.html','admin/index.html'];
    for (const width of [1440,768,390,360]) {
      const page = await browser.newPage({ viewport:{ width,height:900 }, deviceScaleFactor:1 });
      // A screenshot fixture is intentionally unauthenticated and never touches production data.
      await page.route('**/firebase/**', (route) => route.abort());
      for (const route of pages) {
        await page.goto(`${address}/${route}`, { waitUntil:'domcontentloaded' });
        await page.locator('body').waitFor();
        if (route === 'aluno/index.html') {
          await page.evaluate(() => {
            document.body.classList.remove('is-academic-loading');
            const greeting = document.querySelector('[data-student-greeting]');
            if (greeting) greeting.textContent = 'Prévia da experiência acadêmica';
            const card = document.querySelector('[data-continue-learning]');
            card?.classList.remove('is-loading');
            const title = document.querySelector('[data-continue-title]');
            if (title) title.textContent = 'Boas-vindas à Engenharia da Produção Musical';
          });
          await page.locator('.course-module-button').first().waitFor();
        }
        const metrics = await page.evaluate(() => ({
          horizontalOverflow:document.documentElement.scrollWidth > window.innerWidth + 1,
          width:document.documentElement.scrollWidth,
          viewport:window.innerWidth,
          brokenImages:[...document.images].filter((image) => image.complete && image.naturalWidth === 0).length
        }));
        rows.push({ route,width,...metrics });
        if (['index.html','pages/planos.html','aluno/index.html'].includes(route)) {
          await page.screenshot({ path:path.join(output,`${route.replaceAll('/','-')}-${width}.png`), fullPage:true });
        }
        if (route === 'aluno/index.html') {
          await page.locator('[data-play-lesson]').first().click();
          await page.locator('.course-player.is-visible').waitFor();
          await page.screenshot({ path:path.join(output,`aluno-aula-${width}.png`), fullPage:true });
          rows.push({ route:'aluno/aula',width,visible:await page.locator('.course-player.is-visible').isVisible() });
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(rows,null,2));
  const failures = rows.filter((row) => row.horizontalOverflow || row.brokenImages || row.visible === false);
  console.log(`Visual QA: ${rows.length} checks, ${failures.length} issues. Output: ${output}`);
  if (failures.length) { console.log(JSON.stringify(failures,null,2)); process.exitCode = 1; }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
