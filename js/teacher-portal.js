import { firebaseReady } from '../firebase/firebase-client.js';

if (!document.querySelector('link[href="../css/phase-20.css"]')) {
  const phase20 = document.createElement('link');
  phase20.rel = 'stylesheet'; phase20.href = '../css/phase-20.css'; document.head.append(phase20);
}

const scheduleTitles = ['M01 — Boas-vindas','M02 — Fundamentos do som','M03 — Fundamentos musicais','M04 — Estúdio e conexões','M05 — Microfones e captação','M06 — Acústica e PA','M07 — Pro Tools','M08 — Reaper e multi-DAW','M09 — MIDI e plugins','M10 — Arranjo e direção','M11 — Gravação','M12 — Edição','M13 — Mixagem','M14 — Masterização','M15 — Produção vocal','M16 — Inteligência artificial','M17 — Mercado e distribuição','M18 — Vídeo e design','M19 — Projetos práticos','M20 — Avaliação final'];

const authorized = window.empTeacherSession ? Promise.resolve(window.empTeacherSession) : new Promise((resolve) => document.addEventListener('teacher:authorized', (event) => resolve(event.detail), { once: true }));
const safe = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
const formatDate = (value) => {
  if (!value) return '—';
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
};
const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
const timestampValue = (value) => {
  if (!value) return 0;
  if (value.toDate) return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};
const lessonKey = (module, lessonNumber) => `${String(module).toLowerCase()}a${String(lessonNumber).padStart(2, '0')}`;
const lessonCounts = { M01:4, M02:8, M03:8, M04:8, M05:10, M06:10, M07:12, M08:8, M09:8, M10:8, M11:10, M12:8, M13:12, M14:8, M15:8, M16:8, M17:8, M18:6, M19:6, M20:4 };
const hashEmail = async (email) => {
  const bytes = new TextEncoder().encode(String(email).trim().toLowerCase());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
};
const extractYoutubeId = (value) => {
  const raw = String(value || '').trim().replace(/&amp;/g, '&');
  const source = raw.match(/src=["']([^"']+)["']/i)?.[1] || raw;
  const match = source.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/))([A-Za-z0-9_-]{11})/i)
    || source.match(/^([A-Za-z0-9_-]{11})$/);
  return match ? match[1] : '';
};

try {
  const { user } = await authorized;
  const { db, firestoreSdk } = await firebaseReady;
  const { collection, getDocs, getDoc, setDoc, addDoc, doc, query, orderBy, limit, serverTimestamp } = firestoreSdk;
  const roster = document.querySelector('[data-student-roster]');
  const metrics = document.querySelector('[data-teacher-metrics]');
  const assessmentsNode = document.querySelector('[data-assessment-list]');
  const requestsNode = document.querySelector('[data-mentorship-requests]');
  const sessionsNode = document.querySelector('[data-live-session-list]');
  const salesNode = document.querySelector('[data-finance-sales]');
  const enrollmentSummary = document.querySelector('[data-enrollment-summary]');
  const videoListNode = document.querySelector('[data-video-list]');
  const projectGradesNode = document.querySelector('[data-project-grade-list]');
  let rosterStudents = [];

  const scheduleCard = document.createElement('section');
  scheduleCard.className = 'teacher-card teacher-card--wide';
  scheduleCard.id = 'calendario';
  scheduleCard.innerHTML = `<p class="eyebrow">Calendário da turma</p><h2>Planeje a liberação por módulo.</h2><p class="teacher-note">Sem cadastrar 162 datas: escolha quando o módulo abre e o ritmo semanal. Cada vídeo publicado seguirá esse calendário. Use a data individual do vídeo apenas para exceções.</p><form class="module-schedule-card" data-module-schedule><div class="module-schedule-card__grid"><label>Módulo<select name="moduleId" required>${scheduleTitles.map((title,index)=>`<option value="M${String(index+1).padStart(2,'0')}">${safe(title)}</option>`).join('')}</select></label><label>Primeira liberação<input name="releaseAt" type="datetime-local" required></label><label>Aulas por semana<select name="lessonsPerWeek"><option value="2">2 aulas por semana</option><option value="1">1 aula por semana</option><option value="3">3 aulas por semana</option></select></label><label>Título da aula ao vivo (opcional)<input name="liveTitle" maxlength="120"></label><label>Data e hora ao vivo (opcional)<input name="liveStartsAt" type="datetime-local"></label><label>Link da aula ao vivo (opcional)<input name="liveUrl" type="url" placeholder="https://meet.google.com/... ou Zoom"></label></div><button class="button" type="submit">Salvar calendário do módulo</button><p class="form-feedback" data-module-schedule-feedback></p></form><div class="module-schedule-card__list" data-module-schedule-list></div>`;
  document.querySelector('#videos')?.insertAdjacentElement('afterend', scheduleCard);
  const scheduleForm = scheduleCard.querySelector('[data-module-schedule]');
  const scheduleList = scheduleCard.querySelector('[data-module-schedule-list]');

  async function loadModuleSchedules() {
    try {
      const snapshot = await getDocs(query(collection(db, 'moduleSchedules'), limit(50)));
      const schedules = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })).sort((a,b) => String(a.moduleId).localeCompare(String(b.moduleId)));
      scheduleList.innerHTML = schedules.length ? schedules.map((item) => `<article class="module-schedule-row"><div><strong>${safe(item.moduleId)} · ${safe(scheduleTitles[Number(String(item.moduleId).slice(1))-1] || '')}</strong><small>Abre ${formatDate(item.releaseAt)} · ${Number(item.lessonsPerWeek || 2)} aula(s) por semana${item.liveStartsAt ? ` · ao vivo ${formatDate(item.liveStartsAt)}` : ''}</small></div><button class="button button--quiet" data-edit-module-schedule="${safe(item.moduleId)}" type="button">Editar</button></article>`).join('') : '<p>Nenhum módulo foi agendado. Comece pelo M01.</p>';
      scheduleList.querySelectorAll('[data-edit-module-schedule]').forEach((button) => button.addEventListener('click', () => {
        const item = schedules.find((entry) => entry.moduleId === button.dataset.editModuleSchedule); if (!item) return;
        scheduleForm.elements.moduleId.value = item.moduleId; scheduleForm.elements.releaseAt.value = String(item.releaseAt || '').slice(0,16); scheduleForm.elements.lessonsPerWeek.value = String(item.lessonsPerWeek || 2); scheduleForm.elements.liveTitle.value = item.liveTitle || ''; scheduleForm.elements.liveStartsAt.value = String(item.liveStartsAt || '').slice(0,16); scheduleForm.elements.liveUrl.value = item.liveUrl || ''; scheduleForm.scrollIntoView({ behavior:'smooth', block:'center' });
      }));
    } catch { scheduleList.innerHTML = '<p>Não foi possível carregar o calendário. Publique as regras da coleção moduleSchedules.</p>'; }
  }
  scheduleForm.addEventListener('submit', async (event) => {
    event.preventDefault(); const data = new FormData(scheduleForm); const feedback = scheduleForm.querySelector('[data-module-schedule-feedback]'); const moduleId = String(data.get('moduleId'));
    try { await setDoc(doc(db,'moduleSchedules',moduleId), { moduleId, releaseAt:String(data.get('releaseAt')), lessonsPerWeek:Number(data.get('lessonsPerWeek') || 2), liveTitle:String(data.get('liveTitle') || '').trim(), liveStartsAt:String(data.get('liveStartsAt') || ''), liveUrl:String(data.get('liveUrl') || '').trim(), updatedBy:user.uid, updatedAt:serverTimestamp() }, {merge:true}); feedback.textContent = 'Calendário salvo. A turma verá a data automaticamente.'; feedback.className='form-feedback form-feedback--ok'; await loadModuleSchedules(); } catch { feedback.textContent='Não foi possível salvar. Confirme as regras do Firestore para moduleSchedules.'; feedback.className='form-feedback form-feedback--error'; }
  });

  async function loadStudents() {
    const snapshot = await getDocs(query(collection(db, 'students'), orderBy('name'), limit(100)));
    const students = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    roster.innerHTML = students.length ? students.map((student) => `<tr><td data-label="Aluno"><strong>${safe(student.name || student.email || 'Aluno sem nome')}</strong><small>${safe(student.email || student.id)}</small></td><td data-label="Plano">${safe(student.plan || 'A definir')}</td><td data-label="Status"><span class="teacher-status ${student.enrollmentStatus === 'paid' ? 'teacher-status--ok' : ''}">${safe(student.enrollmentStatus || 'Pendente')}</span></td><td data-label="Início">${formatDate(student.courseStart)}<button type="button" class="teacher-link" data-course-start-student="${safe(student.id)}">Definir início</button></td><td data-label="Drive">${student.driveFolderUrl ? `<a href="${safe(student.driveFolderUrl)}" target="_blank" rel="noopener">Abrir pasta</a>` : `<button type="button" class="teacher-link" data-drive-student="${safe(student.id)}">Vincular pasta</button>`}</td></tr>`).join('') : '<tr><td colspan="5">Nenhum acesso de aluno foi ativado ainda.</td></tr>';
    roster.querySelectorAll('[data-drive-student]').forEach((button) => button.addEventListener('click', async () => {
      const driveFolderUrl = window.prompt('Cole o link da pasta individual do Google Drive deste aluno:');
      if (!driveFolderUrl) return;
      try { new URL(driveFolderUrl); await setDoc(doc(db, 'students', button.dataset.driveStudent), { driveFolderUrl, updatedAt: serverTimestamp() }, { merge: true }); await loadStudents(); }
      catch { window.alert('Use um link válido do Google Drive.'); }
    }));
    roster.querySelectorAll('[data-course-start-student]').forEach((button) => button.addEventListener('click', async () => {
      const courseStart = window.prompt('Informe a data de início da turma no formato AAAA-MM-DD:');
      if (!courseStart) return;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(courseStart) || Number.isNaN(new Date(`${courseStart}T00:00:00`).getTime())) { window.alert('Use uma data válida no formato AAAA-MM-DD.'); return; }
      try { await setDoc(doc(db, 'students', button.dataset.courseStartStudent), { courseStart, updatedAt: serverTimestamp() }, { merge: true }); await loadStudents(); }
      catch { window.alert('Não foi possível registrar a data de início. Confira as regras do Firestore.'); }
    }));
    rosterStudents = students;
    return students;
  }

  async function loadAssessments() {
    const snapshot = await getDocs(query(collection(db, 'assessments'), orderBy('createdAt', 'desc'), limit(50)));
    const assessments = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    assessmentsNode.innerHTML = assessments.length ? assessments.map((assessment) => `<article class="assessment-row"><div><strong>${safe(assessment.title)}</strong><span>${safe(assessment.module)} · nota mínima ${safe(assessment.passScore)}%</span></div><button class="button button--quiet" data-view-grades="${assessment.id}" type="button">Ver notas</button><div class="assessment-row__grades" data-grade-list="${assessment.id}"></div></article>`).join('') : '<p>Ainda não há avaliações publicadas.</p>';
    assessmentsNode.querySelectorAll('[data-view-grades]').forEach((button) => button.addEventListener('click', () => loadGrades(button.dataset.viewGrades)));
    return assessments;
  }

  async function loadGrades(assessmentId) {
    const target = assessmentsNode.querySelector(`[data-grade-list="${assessmentId}"]`);
    target.textContent = 'Carregando notas…';
    const snapshot = await getDocs(collection(db, 'assessments', assessmentId, 'submissions'));
    target.innerHTML = snapshot.empty ? '<p>Nenhuma tentativa enviada ainda.</p>' : `<table class="teacher-table teacher-table--nested"><thead><tr><th>Aluno</th><th>Resposta</th><th>Nota</th><th>Status</th><th>Ação</th></tr></thead><tbody>${snapshot.docs.map((entry) => { const item = entry.data(); return `<tr><td>${safe(item.studentName || item.studentEmail || entry.id)}</td><td>${safe(item.answer || '—')}</td><td>${item.score ?? 'A corrigir'}%</td><td>${item.status === 'graded' ? (item.passed ? 'Aprovado' : 'Revisar') : 'Aguardando correção'}</td><td><form data-grade-submission="${assessmentId}" data-student-id="${entry.id}" class="grade-form"><input type="number" name="score" min="0" max="100" value="${item.score ?? ''}" required aria-label="Nota em porcentagem"><button type="submit">Salvar</button></form></td></tr>`; }).join('')}</tbody></table>`;
    target.querySelectorAll('[data-grade-submission]').forEach((form) => form.addEventListener('submit', async (event) => { event.preventDefault(); const score = Number(new FormData(form).get('score')); try { const assessmentDoc = await getDoc(doc(db, 'assessments', assessmentId)); const passScore = Number(assessmentDoc.data()?.passScore || 70); await setDoc(doc(db, 'assessments', assessmentId, 'submissions', form.dataset.studentId), { score, passed: score >= passScore, status: 'graded', gradedBy: user.uid, gradedAt: serverTimestamp() }, { merge: true }); await loadGrades(assessmentId); } catch { window.alert('Não foi possível salvar a nota. Confira as regras do Firestore.'); } }));
  }

  async function loadRequests() {
    const snapshot = await getDocs(query(collection(db, 'mentorshipRequests'), orderBy('createdAt', 'desc'), limit(30)));
    requestsNode.innerHTML = snapshot.empty ? '<p>Nenhuma solicitação de mentoria pendente.</p>' : snapshot.docs.map((entry) => { const request = entry.data(); return `<article><strong>${safe(request.studentName || request.studentEmail || 'Aluno')}</strong><span>${safe(request.topic || 'Sem assunto')} · ${safe(request.status || 'Pendente')}</span><small>${formatDate(request.createdAt)}</small></article>`; }).join('');
    return snapshot.size;
  }

  async function loadSessions() {
    const snapshot = await getDocs(query(collection(db, 'liveSessions'), orderBy('startsAt', 'desc'), limit(30)));
    sessionsNode.innerHTML = snapshot.empty ? '<p>Nenhuma chamada criada ainda.</p>' : snapshot.docs.map((entry) => { const session = entry.data(); return `<article><strong>${safe(session.title)}</strong><span>${formatDate(session.startsAt)} · ${safe(session.status || 'Agendada')}</span><button class="teacher-link" type="button" data-mark-attendance="${entry.id}">Registrar presença</button><div data-attendance-form="${entry.id}"></div></article>`; }).join('');
    sessionsNode.querySelectorAll('[data-mark-attendance]').forEach((button) => button.addEventListener('click', () => {
      const panel = sessionsNode.querySelector(`[data-attendance-form="${button.dataset.markAttendance}"]`);
      panel.innerHTML = rosterStudents.length ? `<form class="attendance-form" data-attendance-session="${button.dataset.markAttendance}"><p>Marque os alunos presentes:</p>${rosterStudents.map((student) => `<label><input type="checkbox" name="student" value="${safe(student.id)}" checked> ${safe(student.name || student.email || student.id)}</label>`).join('')}<button type="submit">Salvar presença</button><span class="form-feedback"></span></form>` : '<p>Cadastre alunos ativos antes de registrar presença.</p>';
      panel.querySelector('[data-attendance-session]')?.addEventListener('submit', async (event) => { event.preventDefault(); const form = event.currentTarget; const present = new Set(new FormData(form).getAll('student')); const feedback = form.querySelector('.form-feedback'); try { await Promise.all(rosterStudents.map((student) => setDoc(doc(db, 'liveSessions', button.dataset.markAttendance, 'attendance', student.id), { studentId: student.id, studentName: student.name || student.email || '', present: present.has(student.id), markedBy: user.uid, markedAt: serverTimestamp() }, { merge: true }))); feedback.textContent = 'Presença registrada.'; feedback.className = 'form-feedback form-feedback--ok'; } catch { feedback.textContent = 'Não foi possível salvar a presença.'; feedback.className = 'form-feedback form-feedback--error'; } });
    }));
  }

  async function loadSales() {
    try {
      const snapshot = await getDocs(query(collection(db, 'sales'), limit(100)));
      const sales = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
      const approved = sales.filter((sale) => sale.status === 'approved').sort((first, second) => timestampValue(second.approvedAt || second.updatedAt) - timestampValue(first.approvedAt || first.updatedAt));
      const gross = approved.reduce((total, sale) => total + Number(sale.grossAmount || 0), 0);
      const commission = approved.reduce((total, sale) => total + Number(sale.commissionAmount || 0), 0);
      const rate = gross > 0 && commission > 0 ? Math.round((commission / gross) * 100) : null;
      const claimedEmails = new Set(rosterStudents.map((student) => String(student.email || '').trim().toLowerCase()).filter(Boolean));
      const waiting = approved.filter((sale) => !claimedEmails.has(String(sale.buyerEmail || '').trim().toLowerCase()));
      if (enrollmentSummary) {
        enrollmentSummary.innerHTML = `<p><strong>${approved.length}</strong> compra${approved.length === 1 ? '' : 's'} aprovada${approved.length === 1 ? '' : 's'} recebida${approved.length === 1 ? '' : 's'} pela Hotmart · <strong>${rosterStudents.filter((student) => student.enrollmentStatus === 'paid').length}</strong> acesso${rosterStudents.filter((student) => student.enrollmentStatus === 'paid').length === 1 ? '' : 's'} ativado${rosterStudents.filter((student) => student.enrollmentStatus === 'paid').length === 1 ? '' : 's'} no Firebase.${waiting.length ? ` ${waiting.length} compra${waiting.length === 1 ? '' : 's'} aguarda${waiting.length === 1 ? '' : 'm'} o primeiro login do comprador: ${safe(waiting.map((sale) => sale.buyerEmail).filter(Boolean).join(', '))}.` : ' Todos os compradores aprovados já ativaram o acesso.'}</p>`;
      }
      if (salesNode) salesNode.innerHTML = approved.length ? `<div class="teacher-table-wrap"><table class="teacher-table teacher-table--sales"><thead><tr><th>Aluno</th><th>Plano</th><th>Compra</th><th>Bruto</th><th>Acesso</th><th>Comissão</th></tr></thead><tbody>${approved.map((sale) => { const email = String(sale.buyerEmail || '').trim().toLowerCase(); const active = claimedEmails.has(email); return `<tr><td data-label="Aluno"><strong>${safe(sale.buyerName || sale.buyerEmail || '—')}</strong><small>${safe(sale.buyerEmail || '')}</small></td><td data-label="Plano">${safe(sale.plan || sale.offerName || '—')}</td><td data-label="Compra">${formatDate(sale.approvedAt || sale.updatedAt)}</td><td data-label="Bruto">${formatMoney(sale.grossAmount)}</td><td data-label="Acesso"><span class="teacher-status ${active ? 'teacher-status--ok' : ''}">${active ? 'Ativado' : 'Aguardando primeiro login'}</span></td><td data-label="Comissão">${sale.commissionAmount ? `${formatMoney(sale.commissionAmount)}${sale.commissionPercentage ? ` (${safe(sale.commissionPercentage)}%)` : ''}` : 'Aguardando dado'}</td></tr>`; }).join('')}</tbody></table></div>` : '<p>Ainda não há vendas aprovadas registradas pelo webhook.</p>';
      return { gross, commission, rate, approved };
    } catch {
      if (salesNode) salesNode.innerHTML = '<p>Os indicadores financeiros aparecerão após a publicação da rota Hotmart e das regras do Firestore.</p>';
      return { gross: 0, commission: 0, rate: null, approved: [] };
    }
  }

  async function loadProjectGrades() {
    if (!projectGradesNode) return;
    const entries = [];
    await Promise.all(rosterStudents.map(async (student) => {
      const snapshot = await getDocs(collection(db, 'students', student.id, 'projects'));
      snapshot.docs.forEach((entry) => entries.push({ student, id: entry.id, ...entry.data() }));
    }));
    projectGradesNode.innerHTML = entries.length ? `<div class="teacher-table-wrap"><table class="teacher-table"><thead><tr><th>Aluno</th><th>Projeto</th><th>Entrega</th><th>Nota</th><th>Feedback</th></tr></thead><tbody>${entries.map((item) => `<tr><td data-label="Aluno">${safe(item.student?.name || item.studentEmail || 'Aluno')}</td><td data-label="Projeto">${item.kind === 'final' ? 'Produção final (M19)' : 'Projeto contínuo'}</td><td data-label="Entrega">${item.driveUrl ? `<a href="${safe(item.driveUrl)}" target="_blank" rel="noopener">Abrir entrega</a>` : 'Sem link'}<small>${safe(item.notes || '')}</small></td><td data-label="Nota"><form class="grade-form" data-project-grade="${safe(item.student.id)}" data-project-kind="${safe(item.id)}"><input name="score" type="number" min="0" max="100" value="${item.score ?? ''}" required aria-label="Nota"><input name="feedback" maxlength="350" value="${safe(item.feedback || '')}" placeholder="Feedback"><button type="submit">Salvar</button></form></td><td data-label="Status">${item.status === 'graded' ? 'Corrigido' : 'Aguardando'}</td></tr>`).join('')}</tbody></table></div>` : '<p>Nenhum projeto foi entregue ainda.</p>';
    projectGradesNode.querySelectorAll('[data-project-grade]').forEach((form) => form.addEventListener('submit', async (event) => {
      event.preventDefault(); const data = new FormData(form);
      try { await setDoc(doc(db, 'students', form.dataset.projectGrade, 'projects', form.dataset.projectKind), { score: Number(data.get('score')), feedback: String(data.get('feedback') || '').trim(), status: 'graded', gradedBy: user.uid, gradedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }); await loadProjectGrades(); }
      catch { window.alert('Não foi possível salvar a nota do projeto. Confira as regras do Firestore.'); }
    }));
  }

  const [students, assessments, requestCount] = await Promise.all([loadStudents(), loadAssessments(), loadRequests()]);
  const finance = await loadSales();
  await loadSessions();
  await loadProjectGrades();
  const metricValues = metrics.querySelectorAll('strong');
  metricValues[0].textContent = students.filter((student) => student.enrollmentStatus === 'paid').length;
  metricValues[1].textContent = finance.approved.length;
  metricValues[2].textContent = assessments.length;
  metricValues[3].textContent = requestCount;
  metricValues[4].textContent = formatMoney(finance.gross);
  metricValues[5].textContent = finance.rate === null ? '—' : `${finance.rate}%`;

  async function loadCourseVideos() {
    if (!videoListNode) return;
    try {
      const snapshot = await getDocs(query(collection(db, 'courseLessons'), limit(500)));
      const videos = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
        .sort((first, second) => String(first.moduleId || '').localeCompare(String(second.moduleId || '')) || Number(first.lessonNumber || 0) - Number(second.lessonNumber || 0));
      videoListNode.innerHTML = videos.length ? videos.map((video) => `<article class="teacher-video-item"><div><strong>${safe(video.moduleId || 'Módulo')} · Aula ${String(video.lessonNumber || 0).padStart(2, '0')}${video.title ? ` · ${safe(video.title)}` : ''}</strong><span>${video.published ? 'Vídeo disponível para a data de liberação da turma.' : 'Vídeo salvo como rascunho; ainda não aparece aos alunos.'}</span><span class="teacher-status ${video.published ? 'teacher-status--ok' : ''}">${video.published ? 'Publicado' : 'Rascunho'}</span></div><button class="button button--quiet" type="button" data-toggle-video="${safe(video.id)}" data-next-status="${video.published ? 'false' : 'true'}">${video.published ? 'Despublicar' : 'Publicar'}</button></article>`).join('') : '<p>Nenhum vídeo foi salvo ainda. Publique a primeira gravação acima.</p>';
      videoListNode.querySelectorAll('[data-toggle-video]').forEach((button) => button.addEventListener('click', async () => {
        try {
          await setDoc(doc(db, 'courseLessons', button.dataset.toggleVideo), { published: button.dataset.nextStatus === 'true', updatedAt: serverTimestamp(), updatedBy: user.uid }, { merge: true });
          await loadCourseVideos();
        } catch {
          window.alert('Não foi possível atualizar o vídeo. Publique as regras do Firestore indicadas no guia da área do professor.');
        }
      }));
    } catch {
      videoListNode.innerHTML = '<p>Não foi possível carregar a lista de vídeos. Verifique se as regras do Firestore incluem a coleção courseLessons.</p>';
    }
  }

  await loadCourseVideos();
  await loadModuleSchedules();

  const releaseOverride = document.createElement('label');
  releaseOverride.innerHTML = 'Liberação individual (opcional)<input name="availableAt" type="datetime-local"><small>Use apenas quando esta aula precisar sair em data diferente do calendário do módulo.</small>';
  document.querySelector('[data-video-publish] .teacher-checkbox')?.insertAdjacentElement('beforebegin', releaseOverride);

  document.querySelector('[data-video-publish]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const feedback = form.querySelector('[data-video-feedback]');
    const moduleId = String(data.get('module') || '');
    const lessonNumber = Number(data.get('lessonNumber'));
    const videoId = extractYoutubeId(data.get('youtube'));
    if (!/^M(0[1-9]|1\d|20)$/.test(moduleId) || !Number.isInteger(lessonNumber) || lessonNumber < 1 || lessonNumber > lessonCounts[moduleId]) {
      feedback.textContent = 'Escolha um módulo e um número de aula válidos.';
      feedback.className = 'form-feedback form-feedback--error';
      return;
    }
    if (!videoId) {
      feedback.textContent = 'Não reconheci o vídeo. Cole um link do YouTube, um link youtu.be ou o código iframe completo.';
      feedback.className = 'form-feedback form-feedback--error';
      return;
    }
    try {
      await setDoc(doc(db, 'courseLessons', lessonKey(moduleId, lessonNumber)), {
        moduleId,
        lessonNumber,
        title: String(data.get('title') || '').trim(),
        videoId,
        availableAt: String(data.get('availableAt') || ''),
        published: data.get('published') === 'on',
        provider: 'youtube',
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      }, { merge: true });
      feedback.textContent = 'Vídeo salvo. Ele será exibido automaticamente aos alunos na data prevista do calendário.';
      feedback.className = 'form-feedback form-feedback--ok';
      form.reset();
      form.elements.lessonNumber.value = '1';
      form.elements.published.checked = true;
      await loadCourseVideos();
    } catch {
      feedback.textContent = 'Não foi possível salvar o vídeo. Publique as regras atualizadas do Firestore antes de tentar novamente.';
      feedback.className = 'form-feedback form-feedback--error';
    }
  });

  const videoForm = document.querySelector('[data-video-publish]');
  videoForm?.elements.module?.addEventListener('change', () => {
    const count = lessonCounts[videoForm.elements.module.value] || 1;
    videoForm.elements.lessonNumber.max = String(count);
    if (Number(videoForm.elements.lessonNumber.value) > count) videoForm.elements.lessonNumber.value = '1';
  });

  document.querySelector('[data-manual-enrollment]')?.addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const feedback = form.querySelector('[data-manual-enrollment-feedback]');
    const email = String(data.get('email') || '').trim().toLowerCase();
    try {
      const id = await hashEmail(email);
      await setDoc(doc(db, 'manualEnrollments', id), { name: String(data.get('name') || '').trim(), email, plan: String(data.get('plan') || 'curso'), courseStart: String(data.get('courseStart') || ''), paymentMode: String(data.get('paymentMode') || 'team-direct'), enrollmentStatus: 'paid', source: 'team-direct', createdBy: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
      feedback.textContent = 'Matrícula manual criada. O aluno terá acesso no primeiro login Google com este e-mail.'; feedback.className = 'form-feedback form-feedback--ok'; form.reset();
    } catch { feedback.textContent = 'Não foi possível criar a matrícula. Confira as regras do Firestore para manualEnrollments.'; feedback.className = 'form-feedback form-feedback--error'; }
  });

  document.querySelector('[data-create-assessment]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget; const data = new FormData(form); const feedback = form.querySelector('[data-assessment-feedback]');
    const options = [data.get('correct'), data.get('wrongOne'), data.get('wrongTwo')].sort(() => Math.random() - .5);
    try {
      const assessment = await addDoc(collection(db, 'assessments'), { title: data.get('title').trim(), module: data.get('module'), passScore: Number(data.get('passScore')), published: true, questions: [{ prompt: data.get('question').trim(), options }], createdBy: user.uid, createdAt: serverTimestamp() });
      await setDoc(doc(db, 'assessmentKeys', assessment.id), { correctAnswers: [data.get('correct').trim()], createdBy: user.uid, createdAt: serverTimestamp() });
      form.reset(); feedback.textContent = 'Avaliação publicada para os alunos autenticados.'; feedback.className = 'form-feedback form-feedback--ok'; await loadAssessments();
    } catch { feedback.textContent = 'Não foi possível publicar. Confira as regras do Firestore para staff.'; feedback.className = 'form-feedback form-feedback--error'; }
  });

  document.querySelector('[data-create-session]')?.addEventListener('submit', async (event) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const feedback = form.querySelector('[data-session-feedback]');
    try { await addDoc(collection(db, 'liveSessions'), { title: data.get('title').trim(), startsAt: new Date(data.get('startsAt')).toISOString(), meetingUrl: data.get('meetingUrl').trim(), createdBy: user.uid, createdAt: serverTimestamp(), status: 'scheduled' }); form.reset(); feedback.textContent = 'Chamada criada. A lista de presença já está disponível abaixo.'; feedback.className = 'form-feedback form-feedback--ok'; await loadSessions(); }
    catch { feedback.textContent = 'Não foi possível criar a chamada. Confira as regras do Firestore.'; feedback.className = 'form-feedback form-feedback--error'; }
  });
} catch (error) {
  console.error('Teacher portal unavailable', error);
}
