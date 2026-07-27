import { firebaseReady } from '../firebase/firebase-client.js';

const authorized = window.empTeacherSession ? Promise.resolve(window.empTeacherSession) : new Promise((resolve) => document.addEventListener('teacher:authorized', (event) => resolve(event.detail), { once: true }));
const safe = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
const formatDate = (value) => {
  if (!value) return '—';
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
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
  let rosterStudents = [];

  async function loadStudents() {
    const snapshot = await getDocs(query(collection(db, 'students'), orderBy('name'), limit(100)));
    const students = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
    roster.innerHTML = students.length ? students.map((student) => `<tr><td><strong>${safe(student.name || student.email || 'Aluno sem nome')}</strong><small>${safe(student.email || student.id)}</small></td><td>${safe(student.plan || 'A definir')}</td><td><span class="teacher-status ${student.enrollmentStatus === 'paid' ? 'teacher-status--ok' : ''}">${safe(student.enrollmentStatus || 'Pendente')}</span></td><td>${formatDate(student.courseStart)}</td><td>${student.driveFolderUrl ? `<a href="${safe(student.driveFolderUrl)}" target="_blank" rel="noopener">Abrir pasta</a>` : `<button type="button" class="teacher-link" data-drive-student="${safe(student.id)}">Vincular pasta</button>`}</td></tr>`).join('') : '<tr><td colspan="5">Nenhuma matrícula ativa foi criada no Firestore ainda.</td></tr>';
    roster.querySelectorAll('[data-drive-student]').forEach((button) => button.addEventListener('click', async () => {
      const driveFolderUrl = window.prompt('Cole o link da pasta individual do Google Drive deste aluno:');
      if (!driveFolderUrl) return;
      try { new URL(driveFolderUrl); await setDoc(doc(db, 'students', button.dataset.driveStudent), { driveFolderUrl, updatedAt: serverTimestamp() }, { merge: true }); await loadStudents(); }
      catch { window.alert('Use um link válido do Google Drive.'); }
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

  const [students, assessments, requestCount] = await Promise.all([loadStudents(), loadAssessments(), loadRequests()]);
  await loadSessions();
  const metricValues = metrics.querySelectorAll('strong');
  metricValues[0].textContent = students.filter((student) => student.enrollmentStatus === 'paid').length;
  metricValues[1].textContent = assessments.length;
  metricValues[2].textContent = requestCount;

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
