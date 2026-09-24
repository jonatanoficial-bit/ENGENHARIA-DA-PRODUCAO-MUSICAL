const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = path.resolve(root, '../../outputs/phase24-qa');
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const mock = `let callback; export const firebaseReady=Promise.resolve({auth:{},authSdk:{onAuthStateChanged(a,cb){callback=cb;cb({displayName:'Conta de teste'});},async signOut(){window.signOutCalls=(window.signOutCalls||0)+1;if(window.failLogout)throw Error('offline');callback(null);}}});`;
(async () => {
  fs.mkdirSync(output,{recursive:true});
  const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(data);});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
  const results=[];
  try {
    for(const width of [1440,768,390,360]) for(const theme of ['dark','light']) {
      const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
      await context.route('**/*',async route=>{
        const url=new URL(route.request().url());
        if(url.origin!==origin)return route.abort();
        if(url.pathname==='/firebase/firebase-client.js')return route.fulfill({contentType:'text/javascript',body:mock});
        if(url.pathname.startsWith('/firebase/')||url.pathname.startsWith('/js/')&&!['/js/app.js','/js/portal-session-controls.js','/js/premium-learning-shell.js'].includes(url.pathname))return route.fulfill({contentType:'text/javascript',body:''});
        return route.continue();
      });
      await context.addInitScript(theme=>localStorage.setItem('emp-theme',theme),theme);
      const page=await context.newPage();
      for(const file of ['aluno/index.html','aluno/perfil.html','aluno/boletim.html','aluno/assistente.html','aluno/certificado.html','professor/index.html']) {
        await page.goto(`${origin}/${file}`);
        await page.evaluate(()=>{document.querySelector('[data-teacher-content]')?.removeAttribute('hidden');document.querySelector('[data-teacher-gate]')?.setAttribute('hidden','');});
        const logout=page.locator('[data-portal-logout]');
        assert(await logout.isVisible(),`${file} logout invisible`);
        assert(await logout.isEnabled(),`${file} logout disabled`);
        if(file.startsWith('aluno/')&&file!=='aluno/index.html')assert.equal(await page.locator('.portal-back').getAttribute('href'),'index.html');
        const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,logoutHeight:document.querySelector('[data-portal-logout]').getBoundingClientRect().height}));
        assert(!metrics.overflow,`${file} ${width} ${theme}: horizontal overflow`);
        assert(metrics.logoutHeight>=44,`${file}: touch target too small`);
        results.push({file,width,theme,...metrics});
        if(file==='professor/index.html'){
          await page.screenshot({path:path.join(output,`professor-${width}-${theme}.png`)});
          await page.locator('.teacher-console__nav a[href="#videos"]').click();
          assert.equal(await page.locator('.teacher-console__nav a[href="#videos"]').getAttribute('aria-current'),'location');
        }
      }
      await page.evaluate(()=>window.failLogout=true);
      await page.locator('[data-portal-logout]').click();
      assert.equal(await page.locator('[data-portal-logout]').innerText(),'Tentar sair novamente');
      assert(await page.locator('[data-portal-logout]').isEnabled());
      await page.evaluate(()=>window.failLogout=false);
      await page.locator('[data-portal-logout]').click();
      await page.waitForURL('**/pages/login.html?status=logout');
      await context.close();
    }
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
    console.log(`${results.length} layouts passed; logout success/failure and teacher navigation passed in 8 configurations.`);
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(err=>{console.error(err);process.exitCode=1;});
