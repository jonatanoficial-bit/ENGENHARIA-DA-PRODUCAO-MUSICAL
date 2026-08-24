import { firebaseReady } from '../firebase/firebase-client.js';
import { MODULES, TOTAL_LESSONS, buildModuleReport, calculateAcademicGrade, formatGrade, moduleFromLessonKey } from './academic-model.js';

const authorized = window.empTeacherSession
  ? Promise.resolve(window.empTeacherSession)
  : new Promise((resolve) => document.addEventListener('teacher:authorized', (event) => resolve(event.detail), { once:true }));
const safe = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
const asTime = (value) => value?.toDate ? value.toDate().getTime() : Number.isNaN(new Date(value || 0).getTime()) ? 0 : new Date(value || 0).getTime();
const dateTime = (value) => {
  const time = asTime(value);
  return time ? new Intl.DateTimeFormat('pt-BR',{ dateStyle:'short', timeStyle:'short' }).format(new Date(time)) : 'Sem registro';
};
const lessonOrder = MODULES.flatMap((module) => Array.from({ length:module.lessons }, (_, index) => `${module.id.toLowerCase()}a${String(index + 1).padStart(2,'0')}`));
const lessonLabel = (key = '') => {
  const moduleId = moduleFromLessonKey(key);
  const module = MODULES.find((item) => item.id === moduleId);
  const number = Number(String(key).match(/a(\d+)$/i)?.[1] || 0);
  return module ? `${module.id} · Aula ${String(number).padStart(2,'0')} · ${module.title}` : String(key || 'Não iniciado');
};

function projectByKind(projects, kind) {
  return projects.find((item) => item.kind === kind || item.id === kind) || {};
}

function academicSummary(record) {
  const assessmentScores = record.assessments.filter((item) => item.status === 'graded' && Number.isFinite(Number(item.score))).map((item) => Number(item.score));
  const activityScores = record.activities.map((item) => Number.isFinite(Number(item.score)) ? Number(item.score) : null).filter((item) => item !== null);
  const continuous = projectByKind(record.projects,'continuous');
  const finalProject = projectByKind(record.projects,'final');
  return calculateAcademicGrade({ assessmentScores, activityScores, continuousScore:continuous.score, finalScore:finalProject.score });
}

function learningPosition(record) {
  const completed = Array.isArray(record.progress.completedLessons) ? record.progress.completedLessons.map((item) => String(item).toLowerCase()) : [];
  const activityLatest = [...record.activities].sort((a,b) => asTime(b.updatedAt || b.submittedAt) - asTime(a.updatedAt || a.submittedAt))[0];
  const lastKey = activityLatest?.lessonKey || completed.sort((a,b) => lessonOrder.indexOf(a) - lessonOrder.indexOf(b)).at(-1) || '';
  const nextKey = lessonOrder.find((key) => !completed.includes(key)) || '';
  return { completed, lastKey, nextKey, activityLatest };
}

try {
  const { user, staff } = await authorized;
  const { db, firestoreSdk } = await firebaseReady;
  const { collection, doc, getDoc, getDocs, setDoc, addDoc, serverTimestamp } = firestoreSdk;
  const rosterNode = document.querySelector('[data-academic-roster]');
  const dialog = document.querySelector('[data-student-detail]');
  const dialogBody = dialog?.querySelector('[data-student-detail-body]');
  const role = String(staff?.role || 'teacher').toLowerCase();
  let records = [];
  let assessments = [];

  async function loadStudent(studentDoc) {
    const student = { id:studentDoc.id, ...studentDoc.data() };
    const [progressDoc, activitiesSnap, projectsSnap, analyticsDoc] = await Promise.all([
      getDoc(doc(db,'students',student.id,'progress','catalog')),
      getDocs(collection(db,'students',student.id,'activities')),
      getDocs(collection(db,'students',student.id,'projects')),
      getDoc(doc(db,'students',student.id,'analytics','access'))
    ]);
    const submissions = await Promise.all(assessments.map(async (assessment) => {
      const submission = await getDoc(doc(db,'assessments',assessment.id,'submissions',student.id));
      return { assessmentId:assessment.id, title:assessment.title, module:assessment.module, ...(submission.exists() ? submission.data() : {}) };
    }));
    return {
      student,
      progress:progressDoc.exists() ? progressDoc.data() : {},
      activities:activitiesSnap.docs.map((entry) => ({ id:entry.id, ...entry.data() })),
      projects:projectsSnap.docs.map((entry) => ({ id:entry.id, ...entry.data() })),
      analytics:analyticsDoc.exists() ? analyticsDoc.data() : {},
      assessments:submissions
    };
  }

  function renderRoster() {
    if (!rosterNode) return;
    if (!records.length) { rosterNode.innerHTML = '<p>Nenhum aluno ativo foi localizado.</p>'; return; }
    rosterNode.innerHTML = records.map((record) => {
      const position = learningPosition(record);
      const grade = academicSummary(record);
      const percent = Math.min(100, Math.round((position.completed.length / Number(record.progress.totalLessons || TOTAL_LESSONS)) * 100));
      return `<article class="academic-student-card"><div class="academic-student-card__identity"><span class="academic-avatar">${safe((record.student.name || record.student.email || 'A').slice(0,1).toUpperCase())}</span><div><h3>${safe(record.student.name || 'Aluno')}</h3><p>${safe(record.student.email || 'E-mail não informado')}</p></div></div><div class="academic-student-card__progress"><div class="academic-progress-ring" style="--academic-progress:${percent}"><strong>${percent}%</strong></div><div><span>Posição atual</span><strong>${safe(position.nextKey ? lessonLabel(position.nextKey) : 'Curso concluído')}</strong><small>Última conclusão: ${safe(position.lastKey ? lessonLabel(position.lastKey) : 'nenhuma')}</small></div></div><dl><div><dt>Média parcial</dt><dd>${formatGrade(grade.partial)}</dd></div><div><dt>Acessos</dt><dd>${Number(record.analytics.accessCount || 0)}</dd></div><div><dt>Último acesso</dt><dd>${safe(dateTime(record.analytics.lastAccessAt))}</dd></div><div><dt>Comentários</dt><dd>${record.activities.length}</dd></div></dl><button class="button button--quiet" type="button" data-open-student="${safe(record.student.id)}">Abrir prontuário completo</button></article>`;
    }).join('');
    rosterNode.querySelectorAll('[data-open-student]').forEach((button) => button.addEventListener('click', () => openStudent(button.dataset.openStudent)));
  }

  function activityRows(record) {
    return [...record.activities].sort((a,b) => asTime(b.updatedAt || b.submittedAt) - asTime(a.updatedAt || a.submittedAt)).map((item) => `<article class="student-comment"><div><span class="badge">${safe(item.moduleId || moduleFromLessonKey(item.lessonKey))}</span><strong>${safe(item.title || lessonLabel(item.lessonKey))}</strong><small>${safe(dateTime(item.updatedAt || item.submittedAt))}</small></div><blockquote>${safe(item.answer || 'Sem comentário')}</blockquote><form data-grade-activity="${safe(record.student.id)}" data-activity-id="${safe(item.id)}"><label>Nota (0–100)<input type="number" name="score" min="0" max="100" value="${item.score ?? ''}" required></label><label>Feedback<input name="feedback" maxlength="350" value="${safe(item.feedback || '')}" placeholder="Comentário do professor"></label><button type="submit">Salvar</button></form></article>`).join('') || '<p>Nenhuma aula foi marcada como assistida.</p>';
  }

  function openStudent(studentId) {
    const record = records.find((item) => item.student.id === studentId);
    if (!record || !dialog || !dialogBody) return;
    const position = learningPosition(record);
    const grade = academicSummary(record);
    const modules = buildModuleReport({ completedLessons:position.completed, activities:record.activities, assessments:record.assessments });
    const continuous = projectByKind(record.projects,'continuous');
    const finalProject = projectByKind(record.projects,'final');
    dialogBody.innerHTML = `<header><p class="eyebrow">Prontuário acadêmico individual</p><h2>${safe(record.student.name || 'Aluno')}</h2><p>${safe(record.student.email || '')} · ${safe(record.student.plan || 'plano não informado')}</p></header><div class="student-record-summary"><article><span>Curso</span><strong>${Math.round((position.completed.length / TOTAL_LESSONS) * 100)}%</strong><small>${position.completed.length}/${TOTAL_LESSONS} aulas</small></article><article><span>Média parcial</span><strong>${formatGrade(grade.partial)}</strong><small>${grade.availableWeight}% avaliados</small></article><article><span>Projeto 1</span><strong>${formatGrade(Number.isFinite(Number(continuous.score)) ? continuous.score : null)}</strong><small>Peso 15%</small></article><article><span>Projeto 2 / TCC</span><strong>${formatGrade(Number.isFinite(Number(finalProject.score)) ? finalProject.score : null)}</strong><small>Peso 20%</small></article></div><section><h3>Notas e avanço por módulo</h3><div class="academic-table-wrap"><table class="teacher-table academic-module-table"><thead><tr><th>Módulo</th><th>Aulas</th><th>Atividades</th><th>Provas</th><th>Média</th></tr></thead><tbody>${modules.map((module) => `<tr><td>${module.id}<small>${safe(module.title)}</small></td><td>${module.watched}/${module.lessons}</td><td>${formatGrade(module.activityAverage)}</td><td>${formatGrade(module.assessmentAverage)}</td><td>${formatGrade(module.average)}</td></tr>`).join('')}</tbody></table></div></section><section><h3>Comentários após os vídeos</h3><p class="teacher-note">Cada item abaixo corresponde a uma aula que o estudante declarou ter assistido.</p><div class="student-comment-list">${activityRows(record)}</div></section>`;
    dialogBody.querySelectorAll('[data-grade-activity]').forEach((form) => form.addEventListener('submit', gradeActivity));
    dialog.showModal();
  }

  async function gradeActivity(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      await setDoc(doc(db,'students',form.dataset.gradeActivity,'activities',form.dataset.activityId), { score:Number(data.get('score')), feedback:String(data.get('feedback') || '').trim(), status:'graded', gradedBy:user.uid, gradedAt:serverTimestamp(), updatedAt:serverTimestamp() }, { merge:true });
      button.textContent = 'Salvo';
      await loadAll();
    } catch { button.textContent = 'Erro ao salvar'; }
    finally { button.disabled = false; }
  }

  async function loadAll() {
    if (rosterNode) rosterNode.innerHTML = '<p>Montando os prontuários acadêmicos…</p>';
    const [studentSnap, assessmentSnap] = await Promise.all([getDocs(collection(db,'students')), getDocs(collection(db,'assessments'))]);
    assessments = assessmentSnap.docs.map((entry) => ({ id:entry.id, ...entry.data() }));
    records = await Promise.all(studentSnap.docs.map(loadStudent));
    records.sort((a,b) => String(a.student.name || a.student.email).localeCompare(String(b.student.name || b.student.email),'pt-BR'));
    renderRoster();
  }

  const importForm = document.querySelector('[data-assessment-import]');
  document.querySelector('[data-copy-assessment-prompt]')?.addEventListener('click', async (event) => {
    const prompt = `Crie uma avaliação da Engenharia da Produção Musical em JSON válido, sem markdown. Use exatamente este formato: {"titulo":"Avaliação M01","modulo":"M01","notaMinima":70,"perguntas":[{"pergunta":"Texto da questão","alternativas":["A","B","C","D"],"correta":0}]}. Gere entre 5 e 10 perguntas, com 4 alternativas cada. O campo correta é o índice entre 0 e 3. Tema da aula/módulo: [ESCREVA O TEMA AQUI].`;
    await navigator.clipboard.writeText(prompt);
    event.currentTarget.textContent = 'Prompt copiado';
  });

  importForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = importForm.querySelector('.form-feedback');
    const button = importForm.querySelector('button[type="submit"]');
    try {
      const raw = String(new FormData(importForm).get('json') || '').trim().replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();
      const input = JSON.parse(raw);
      const moduleId = String(input.modulo || input.module || '').toUpperCase();
      const sourceQuestions = input.perguntas || input.questions;
      if (!MODULES.some((item) => item.id === moduleId)) throw new Error('Use um módulo entre M01 e M20.');
      if (!Array.isArray(sourceQuestions) || !sourceQuestions.length || sourceQuestions.length > 30) throw new Error('Inclua de 1 a 30 perguntas.');
      const correctAnswers = [];
      const questions = sourceQuestions.map((question, index) => {
        const prompt = String(question.pergunta || question.prompt || '').trim();
        const options = question.alternativas || question.options;
        const correctIndex = Number(question.correta ?? question.correctIndex);
        if (!prompt || !Array.isArray(options) || options.length < 2 || options.length > 6 || !Number.isInteger(correctIndex) || !options[correctIndex]) throw new Error(`Revise a pergunta ${index + 1}.`);
        const cleanOptions = options.map((option) => String(option).trim()).filter(Boolean);
        if (cleanOptions.length !== options.length) throw new Error(`A pergunta ${index + 1} possui alternativa vazia.`);
        correctAnswers.push(cleanOptions[correctIndex]);
        return { prompt:prompt.slice(0,500), options:cleanOptions.map((option) => option.slice(0,300)) };
      });
      button.disabled = true;
      const assessment = await addDoc(collection(db,'assessments'), { title:String(input.titulo || input.title || `Avaliação ${moduleId}`).trim().slice(0,120), module:moduleId, passScore:Math.min(100,Math.max(1,Number(input.notaMinima || input.passScore || 70))), published:true, questions, createdBy:user.uid, createdAt:serverTimestamp(), source:'json-import' });
      await setDoc(doc(db,'assessmentKeys',assessment.id), { correctAnswers, createdBy:user.uid, createdAt:serverTimestamp() });
      importForm.reset();
      feedback.textContent = `${questions.length} perguntas publicadas com sucesso.`;
      feedback.className = 'form-feedback form-feedback--ok';
      await loadQuickAssessments();
      await loadAll();
    } catch (error) {
      feedback.textContent = `Não foi possível importar: ${error.message}`;
      feedback.className = 'form-feedback form-feedback--error';
    } finally { button.disabled = false; }
  });

  async function autoGrade(assessmentId, button) {
    button.disabled = true;
    try {
      const [keyDoc, assessmentDoc, submissions] = await Promise.all([
        getDoc(doc(db,'assessmentKeys',assessmentId)), getDoc(doc(db,'assessments',assessmentId)), getDocs(collection(db,'assessments',assessmentId,'submissions'))
      ]);
      if (!keyDoc.exists()) throw new Error('Gabarito não localizado.');
      const keys = keyDoc.data().correctAnswers || [];
      const passScore = Number(assessmentDoc.data()?.passScore || 70);
      const normalize = (value) => String(value || '').trim().toLocaleLowerCase('pt-BR');
      await Promise.all(submissions.docs.map(async (submission) => {
        const answers = Array.isArray(submission.data().answers) ? submission.data().answers : [submission.data().answer];
        if (!keys.length) return;
        const correct = keys.reduce((sum,key,index) => sum + (normalize(answers[index]) === normalize(key) ? 1 : 0),0);
        const score = Math.round((correct / keys.length) * 100);
        await setDoc(submission.ref, { score, passed:score >= passScore, status:'graded', gradedBy:user.uid, gradedAt:serverTimestamp() }, { merge:true });
      }));
      button.textContent = `${submissions.size} tentativa(s) corrigida(s)`;
      await loadAll();
    } catch (error) { button.textContent = error.message || 'Falha na correção'; }
    finally { button.disabled = false; }
  }

  async function loadQuickAssessments() {
    const node = document.querySelector('[data-quick-assessment-list]');
    if (!node) return;
    const snapshot = await getDocs(collection(db,'assessments'));
    const items = snapshot.docs.map((entry) => ({ id:entry.id, ...entry.data() })).sort((a,b) => asTime(b.createdAt)-asTime(a.createdAt));
    node.innerHTML = items.length ? items.map((item) => `<article><div><strong>${safe(item.title)}</strong><small>${safe(item.module)} · ${(item.questions || []).length} questão(ões)</small></div><button class="button button--quiet" type="button" data-auto-grade="${safe(item.id)}">Corrigir tentativas</button></article>`).join('') : '<p>Nenhuma avaliação publicada.</p>';
    node.querySelectorAll('[data-auto-grade]').forEach((button) => button.addEventListener('click', () => autoGrade(button.dataset.autoGrade,button)));
  }

  const adminSection = document.querySelector('[data-admin-tools]');
  if (adminSection) adminSection.hidden = !['admin','owner'].includes(role);
  document.querySelector('[data-professor-admin]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget; const feedback = form.querySelector('.form-feedback'); const data = new FormData(form);
    try {
      const token = await user.getIdToken();
      const response = await fetch('../api/manage-staff',{ method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` }, body:JSON.stringify({ action:'upsertProfessor', email:String(data.get('email') || '').trim(), name:String(data.get('name') || '').trim(), role:String(data.get('role') || 'teacher'), active:data.get('active') === 'on' }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      feedback.textContent = `Professor ${result.email} salvo com sucesso.`; feedback.className='form-feedback form-feedback--ok'; form.reset(); form.elements.active.checked=true; await loadStaff();
    } catch (error) { feedback.textContent=error.message || 'Não foi possível salvar o professor.'; feedback.className='form-feedback form-feedback--error'; }
  });
  document.querySelector('[data-supporters-admin]')?.addEventListener('submit', async (event) => {
    event.preventDefault(); const form=event.currentTarget; const feedback=form.querySelector('.form-feedback'); const data=new FormData(form);
    try { const token=await user.getIdToken(); const response=await fetch('../api/manage-staff',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({action:'updateSupporters',siteUrl:String(data.get('siteUrl')||'').trim()})}); const result=await response.json(); if(!response.ok) throw new Error(result.error); feedback.textContent='Portal de apoiadores atualizado.'; feedback.className='form-feedback form-feedback--ok'; }
    catch(error){ feedback.textContent=error.message || 'Não foi possível atualizar.'; feedback.className='form-feedback form-feedback--error'; }
  });

  async function loadStaff() {
    const node=document.querySelector('[data-staff-list]'); if(!node || !['admin','owner'].includes(role)) return;
    const snapshot=await getDocs(collection(db,'staff'));
    node.innerHTML=snapshot.docs.map((entry)=>{const item=entry.data();return `<article><div><strong>${safe(item.name||item.email||entry.id)}</strong><small>${safe(item.email||'')} · ${safe(item.role||'teacher')}</small></div><span class="teacher-status ${item.active===true?'teacher-status--ok':''}">${item.active===true?'Ativo':'Inativo'}</span></article>`;}).join('') || '<p>Nenhum professor cadastrado.</p>';
  }

  dialog?.querySelector('[data-close-student-detail]')?.addEventListener('click', () => dialog.close());
  await Promise.all([loadAll(), loadQuickAssessments(), loadStaff()]);
} catch (error) {
  const node = document.querySelector('[data-academic-roster]');
  if (node) node.innerHTML = `<p class="form-feedback form-feedback--error">Não foi possível montar o painel acadêmico (${safe(error?.code || error?.message || 'indisponível')}). Publique as regras da Fase 22 e tente novamente.</p>`;
}
