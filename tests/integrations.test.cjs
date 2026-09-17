const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const path = require('node:path');
const email = 'student@example.test';
const enrollmentPath = 'enrollments/' + crypto.createHash('sha256').update(email).digest('hex');

// In-memory Firestore double: rejects transaction reads after writes and commits atomically.
function database(seed = {}) {
  const records = new Map(Object.entries(structuredClone(seed)));
  const snapshot = (ref) => ({ id:ref.id, ref, exists:records.has(ref.path), data:() => structuredClone(records.get(ref.path)) });
  function collection(p, filters = [], max = Infinity) {
    return { path:p, doc(id) { return ref(p + '/' + id); },
      where(field, op, value) { assert.equal(op, '=='); return collection(p, [...filters, [field,value]], max); },
      limit(n) { return collection(p, filters, n); },
      async get() { return { docs:[...records.keys()].filter(k => k.startsWith(p+'/') && k.split('/').length === p.split('/').length+1)
        .filter(k => filters.every(([f,v]) => records.get(k)[f] === v)).slice(0,max).map(k => snapshot(ref(k))) }; } };
  }
  function ref(p) { return { path:p, id:p.split('/').at(-1), collection:n => collection(p+'/'+n), get:async () => snapshot(ref(p)),
    async set(data, options) { records.set(p, {...(options?.merge ? records.get(p) : {}), ...structuredClone(data)}); } }; }
  return { records, collection,
    async runTransaction(fn) { const writes = []; const result = await fn({
      async get(target) { assert.equal(writes.length,0,'Firestore requires all reads before writes'); return target.get(); },
      set(target,data,options) { writes.push([target,data,options]); }
    }); for (const [target,data,options] of writes) await target.set(data,options); return result; }
  };
}
function handler(name, db) {
  const module = {exports:{}};
  const admin = { getDb:() => db, serverTimestamp:() => 'SERVER_TIMESTAMP',
    getFirebaseAuth:() => ({verifyIdToken:async token => { if (token !== 'valid') throw new Error('invalid token'); return {uid:'student', email, name:'Student'}; }}) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../api',name+'.js'),'utf8'), {
    module, require:n => n === './_firebase-admin' ? admin : require(n), Buffer,
    process:{env:{HOTMART_HOTTOK:'test-only-token'}}, console:{error(){}}, Date
  });
  return module.exports;
}
async function call(fn, body = {}, headers = {}) {
  const res = { code:200, headers:{}, setHeader(k,v) { this.headers[k]=v; }, status(code) { this.code=code; return this; }, json(data) { this.body=data; return this; } };
  await fn({method:'POST',body,headers},res); return res;
}
function event(type, transaction = 'purchase-1', time = 100) {
  return {event:type,creation_date:time,data:{buyer:{email:email.toUpperCase(),name:'Student'},purchase:{transaction,offer:{code:'9824kdrk'},price:{value:100}}}};
}
const webhook = (db, payload, token = 'test-only-token') => call(handler('hotmart-webhook',db), payload, {'x-hotmart-hottok':token});
const claim = db => call(handler('claim-enrollment',db),{idToken:'valid'});

test('webhook refuses bad tokens without writing',async () => {
  const db = database(); assert.equal((await webhook(db,event('PURCHASE_APPROVED'),'bad')).code,401); assert.equal(db.records.size,0);
});
test('unknown events do not revoke enrollment',async () => {
  const db = database({[enrollmentPath]:{enrollmentStatus:'paid'}});
  await webhook(db,event('PURCHASE_BILLET_PRINTED')); assert.equal(db.records.size,1); assert.equal(db.records.get(enrollmentPath).enrollmentStatus,'paid');
});
test('approval creates enrollment; claim preserves name, dates and unrelated student data',async () => {
  const db = database({'students/student':{email,name:'Preferred name',courseStart:'2026-08-15',claimedAt:'original',driveUrl:'https://example.test/folder'}});
  assert.equal((await webhook(db,event('PURCHASE_APPROVED'))).code,200);
  assert.equal((await claim(db)).body.status,'paid');
  const student = db.records.get('students/student');
  assert.equal(student.plan,'premium'); assert.equal(student.name,'Preferred name'); assert.equal(student.courseStart,'2026-08-15');
  assert.equal(student.claimedAt,'original'); assert.equal(student.driveUrl,'https://example.test/folder');
});
test('refund blocks existing student, repeated approval cannot revive it through claim',async () => {
  const db = database(); await webhook(db,event('PURCHASE_APPROVED')); await claim(db);
  await webhook(db,event('PURCHASE_REFUNDED','purchase-1',200));
  await webhook(db,event('PURCHASE_APPROVED','purchase-1',300));
  assert.equal(db.records.get('students/student').enrollmentStatus,'blocked');
  assert.equal((await claim(db)).body.status,'blocked');
});
test('refund of a different purchase preserves current enrollment',async () => {
  const db = database(); await webhook(db,event('PURCHASE_APPROVED')); await claim(db);
  await webhook(db,event('PURCHASE_APPROVED','purchase-2',200));
  await webhook(db,event('PURCHASE_REFUNDED','purchase-1',300));
  assert.equal(db.records.get(enrollmentPath).enrollmentStatus,'paid'); assert.equal(db.records.get('students/student').latestTransaction,'purchase-2');
});
test('manual paid access is preserved while recording Hotmart refund',async () => {
  const db = database({[enrollmentPath]:{source:'team-direct',enrollmentStatus:'paid'},'students/student':{email,enrollmentStatus:'paid'}});
  await webhook(db,event('PURCHASE_REFUNDED')); assert.equal(db.records.get(enrollmentPath).enrollmentStatus,'paid');
  assert.equal(db.records.get('sales/purchase-1').status,'blocked');
});
test('older events cannot replace more recent access state',async () => {
  const db = database(); await webhook(db,event('PURCHASE_APPROVED','purchase-1',200));
  await webhook(db,event('PURCHASE_CANCELED','purchase-1',100)); assert.equal(db.records.get(enrollmentPath).enrollmentStatus,'paid');
});
test('manual and historical-sale recovery work atomically; pending claim writes nothing',async () => {
  const manual = database({[enrollmentPath.replace('enrollments/','manualEnrollments/')]:{enrollmentStatus:'paid',courseStart:'2026-08-10',plan:'essencial'}});
  assert.equal((await claim(manual)).body.status,'paid'); assert.equal(manual.records.get('students/student').courseStart,'2026-08-10');
  const sale = database({'sales/legacy':{buyerEmail:email,status:'approved',transaction:'legacy',plan:'premium'}});
  assert.equal((await claim(sale)).body.status,'paid'); assert.equal(sale.records.get(enrollmentPath).latestTransaction,'legacy');
  const empty = database(); assert.equal((await claim(empty)).body.status,'pending'); assert.equal(empty.records.size,0);
});

const counts = [4,8,8,8,10,10,12,8,8,8,10,8,12,8,8,8,8,6,6,4];
const lessons = counts.flatMap((n,i) => Array.from({length:n},(_,j) => `m${String(i+1).padStart(2,'0')}a${String(j+1).padStart(2,'0')}`));
function academicSeed(completed = 146) {
  const seed = {'students/student':{enrollmentStatus:'paid',name:'Student'},'students/student/progress/catalog':{completedLessons:lessons.slice(0,completed)},
    'assessments/test':{module:'M01'},'assessments/test/submissions/student':{status:'graded',score:80},
    'students/student/projects/continuous':{kind:'continuous',status:'graded',score:80},'students/student/projects/final':{kind:'final',status:'graded',score:80}};
  lessons.slice(0,completed).forEach(key => { seed['students/student/activities/'+key] = {lessonKey:key,answer:'A valid learning reflection.',status:'graded',score:80}; }); return seed;
}
const issue = db => call(handler('issue-certificate',db),{}, {authorization:'Bearer valid'});
test('certificate requires valid unique completed lessons and submitted activities',async () => {
  assert.equal((await issue(database(academicSeed(145)))).code,403);
  const seed = academicSeed(1); seed['students/student/progress/catalog'].completedLessons = Array(162).fill('m01a01');
  assert.equal((await issue(database(seed))).code,403);
  const missing = academicSeed(); for (const key of Object.keys(missing)) if (key.includes('/activities/')) delete missing[key];
  assert.equal((await issue(database(missing))).code,403);
});
test('ungraded or absent project scores do not grant certificates; graded zero counts as zero',async () => {
  for (const project of [{status:'submitted',score:100},{status:'graded',score:null},{status:'graded',score:0},{status:'graded',score:101}]) {
    const seed = academicSeed(); seed['students/student/projects/final'] = {kind:'final',...project};
    assert.equal((await issue(database(seed))).code,403);
  }
});
test('eligible certificate issues once, subsequent request reuses record; blocked student denied',async () => {
  const db = database(academicSeed()); const first = await issue(db); assert.equal(first.code,201); assert.equal(first.body.finalScore,80);
  const second = await issue(db); assert.equal(second.code,200); assert.equal(second.body.code,first.body.code);
  db.records.get('students/student').enrollmentStatus='blocked'; assert.equal((await issue(db)).code,403);
});
test('academic model excludes pending marks while preserving a genuine zero',async () => {
  const source = fs.readFileSync(path.join(__dirname,'../js/academic-model.js'),'utf8');
  const model = await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  assert.equal(model.gradeValue(null),null); assert.equal(model.gradeValue(''),null); assert.equal(model.gradeValue(0),0);
  assert.equal(model.publishedScore({status:'submitted',score:100}),null);
  assert.equal(model.calculateAcademicGrade({assessmentScores:[80],activityScores:[80]}).official,null);
  assert.equal(model.calculateAcademicGrade({assessmentScores:[80],activityScores:[80],continuousScore:80,finalScore:80}).official,80);
  assert.equal(model.average([null,undefined,'',0,100]),50);
});

test('all official offers map correctly and repeated deliveries keep one sale', async () => {
  for (const [code,plan] of Object.entries({cqiymwjq:'essencial',wuqbrxz6:'profissional','9824kdrk':'premium'})) {
    const db=database();const payload=event('PURCHASE_APPROVED');payload.data.purchase.offer.code=code;
    await webhook(db,payload);await webhook(db,payload);
    assert.equal(db.records.get(enrollmentPath).plan,plan);assert.equal([...db.records.keys()].filter(k=>k.startsWith('sales/')).length,1);
  }
});
test('invalid authentication cannot claim access or issue certificates', async () => {
  const db=database(academicSeed());const size=db.records.size;
  assert.notEqual((await call(handler('claim-enrollment',db),{idToken:'bad'})).code,200);
  assert.equal((await call(handler('issue-certificate',db),{}, {authorization:'Bearer bad'})).code,401);
  assert.equal(db.records.size,size);
});
test('a new paid transaction restores access after a prior refund',async () => {
  const db=database();await webhook(db,event('PURCHASE_APPROVED'));await claim(db);
  await webhook(db,event('PURCHASE_REFUNDED','purchase-1',200));await webhook(db,event('PURCHASE_APPROVED','purchase-2',300));
  assert.equal((await claim(db)).body.status,'paid');assert.equal(db.records.get('students/student').latestTransaction,'purchase-2');
});
test('frontend certificate completion uses the same unique evidence as server',async () => {
  const source=fs.readFileSync(path.join(__dirname,'../js/academic-model.js'),'utf8');
  const model=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const activities=lessons.map(id=>({id,answer:'A valid learning reflection.'}));
  assert.equal(model.verifiedLessonCount(lessons,activities),162);
  assert.equal(model.verifiedLessonCount(['m01a01','m01a01','m99a99'],activities),1);
  assert.equal(model.verifiedLessonCount(lessons,[]),0);
  assert.equal(Math.floor(model.verifiedLessonCount(lessons.slice(0,145),activities)/162*100),89);
});
