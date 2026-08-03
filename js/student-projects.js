import { firebaseReady } from '../firebase/firebase-client.js';

const root = document.querySelector('[data-student-projects]');
const liveRoot = document.querySelector('[data-student-live-sessions]');
const safe = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
const dateLabel = (value) => { const date = value?.toDate ? value.toDate() : new Date(value); return Number.isNaN(date.getTime()) ? 'Data a definir' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(date); };

if (firebaseReady && (root || liveRoot)) {
  const { auth, authSdk, db, firestoreSdk } = await firebaseReady;
  const { collection, doc, getDoc, getDocs, query, orderBy, setDoc, serverTimestamp } = firestoreSdk;
  authSdk.onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try {
      const [staffSnapshot, progressSnapshot, projectsSnapshot, sessionsSnapshot] = await Promise.all([
        getDoc(doc(db, 'staff', user.uid)), getDoc(doc(db, 'students', user.uid, 'progress', 'catalog')),
        getDocs(collection(db, 'students', user.uid, 'projects')), getDocs(query(collection(db, 'liveSessions'), orderBy('startsAt', 'asc')))
      ]);
      const isStaff = staffSnapshot.exists() && staffSnapshot.data().active === true;
      const completed = progressSnapshot.exists() && Array.isArray(progressSnapshot.data().completedLessons) ? progressSnapshot.data().completedLessons : [];
      const projects = new Map(projectsSnapshot.docs.map((entry) => [entry.id, entry.data()]));
      const canStartContinuous = isStaff || completed.includes('m01a02');
      const canStartFinal = isStaff || completed.some((key) => key.startsWith('m19'));
      if (root) {
        const items = [
          { kind: 'continuous', title: 'Projeto contínuo: sua produção autoral', release: canStartContinuous, description: 'Inicie na Aula 2 do M01 e evolua esta mesma produção ao longo de toda a formação.', weight: '15% da média final' },
          { kind: 'final', title: 'Produção avaliativa independente', release: canStartFinal, description: 'A partir do M19, realize uma produção completa sozinho e envie a versão final para avaliação.', weight: '20% da média final' }
        ];
        root.innerHTML = `<div class="section-heading"><div><p class="eyebrow">Projetos principais</p><h2>Construção de portfólio com orientação.</h2></div><span class="badge">Avaliação contínua</span></div><div class="project-grid">${items.map((item) => { const project = projects.get(item.kind); return `<article class="project-card ${item.release ? '' : 'project-card--locked'}"><span class="project-card__weight">${item.weight}</span><h3>${item.title}</h3><p>${item.description}</p>${project?.status === 'graded' ? `<p class="form-feedback form-feedback--ok">Nota publicada: ${safe(project.score)}%${project.feedback ? ` · ${safe(project.feedback)}` : ''}</p>` : ''}${isStaff ? '<p class="teacher-note">Visualização docente: use o painel do professor para corrigir entregas.</p>' : item.release ? `<form data-project="${item.kind}"><label>Link da entrega (Google Drive / YouTube)<input name="driveUrl" type="url" value="${safe(project?.driveUrl || '')}" required placeholder="https://"></label><label>Descrição da evolução<textarea name="notes" minlength="12" maxlength="1200" required placeholder="O que você aplicou nesta etapa?"></textarea></label><button class="button button--quiet" type="submit">${project ? 'Atualizar entrega' : 'Enviar entrega'}</button><p class="form-feedback"></p></form>` : '<p class="project-card__lock">🔒 Libera automaticamente quando você cumprir o pré-requisito.</p>'}</article>`; }).join('')}</div>`;
        root.querySelectorAll('[data-project]').forEach((form) => form.addEventListener('submit', async (event) => {
          event.preventDefault(); const feedback = form.querySelector('.form-feedback'); const data = new FormData(form); const kind = form.dataset.project;
          try { await setDoc(doc(db, 'students', user.uid, 'projects', kind), { kind, studentId: user.uid, studentName: user.displayName || '', studentEmail: user.email || '', driveUrl: String(data.get('driveUrl')).trim(), notes: String(data.get('notes')).trim(), status: 'submitted', submittedAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true }); feedback.textContent = 'Entrega enviada para correção da equipe.'; feedback.className = 'form-feedback form-feedback--ok'; }
          catch { feedback.textContent = 'Não foi possível registrar a entrega. Tente novamente.'; feedback.className = 'form-feedback form-feedback--error'; }
        }));
      }
      if (liveRoot) {
        const sessions = sessionsSnapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })).filter((session) => !session.startsAt || new Date(session.startsAt).getTime() > Date.now() - 8.64e7).slice(0, 4);
        liveRoot.innerHTML = `<div class="section-heading"><div><p class="eyebrow">Aulas ao vivo</p><h2>Próximos encontros da turma.</h2></div><span class="badge">Agenda integrada</span></div>${sessions.length ? `<div class="live-session-grid">${sessions.map((session) => `<article><strong>${safe(session.title)}</strong><span>${dateLabel(session.startsAt)}</span>${session.meetingUrl ? `<a class="button button--quiet" target="_blank" rel="noopener" href="${safe(session.meetingUrl)}">Entrar na aula ao vivo</a>` : '<small>O link será disponibilizado pela equipe antes do encontro.</small>'}</article>`).join('')}</div>` : '<p>Os próximos encontros serão publicados pela equipe acadêmica.</p>'}`;
      }
    } catch { if (root) root.innerHTML = '<p>Não foi possível carregar projetos agora. Confira as regras do Firestore e tente novamente.</p>'; }
  });
}
