const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname,'../firebase/teacher-guard.js'),'utf8').replace(/^import .*;\r?\n/,'');
async function fixture(readStaff) {
  const content={hidden:true}, notice={hidden:false}, auth={currentUser:{uid:'teacher'}};
  let callback, redirect;
  const window={location:{replace(url){redirect=url;}}};
  const document={querySelector:s=>s==='[data-teacher-gate]'?notice:content,documentElement:{dataset:{}},dispatchEvent(){}};
  const firebaseReady=Promise.resolve({auth,authSdk:{onAuthStateChanged(a,cb){callback=cb;}},db:{},firestoreSdk:{doc(){},getDocFromServer:readStaff}});
  await vm.runInNewContext(`(async()=>{${source}})()`,{window,document,firebaseReady,CustomEvent:class {}});
  return {auth,content,notice,window,change:user=>callback(user),redirect:()=>redirect};
}
const staff=()=>Promise.resolve({exists:()=>true,data:()=>({active:true,role:'teacher'})});
test('teacher sign-out hides the authorized panel and redirects to login',async()=>{
  const f=await fixture(staff);await f.change({uid:'teacher'});assert.equal(f.content.hidden,false);
  f.auth.currentUser=null;await f.change(null);
  assert.equal(f.content.hidden,true);assert.equal(f.window.empTeacherSession,undefined);assert.match(f.redirect(),/login.html/);
});
test('an in-flight staff lookup cannot reveal the panel after sign-out',async()=>{
  let finish;const f=await fixture(()=>new Promise(resolve=>finish=resolve));
  const pending=f.change({uid:'teacher'});f.auth.currentUser=null;await f.change(null);finish(await staff());await pending;
  assert.equal(f.content.hidden,true);assert.equal(f.window.empTeacherSession,undefined);
});
test('inactive staff cannot reveal the panel',async()=>{
  const f=await fixture(()=>Promise.resolve({exists:()=>true,data:()=>({active:false})}));await f.change({uid:'teacher'});
  assert.equal(f.content.hidden,true);assert.equal(f.window.empTeacherSession,undefined);
});
