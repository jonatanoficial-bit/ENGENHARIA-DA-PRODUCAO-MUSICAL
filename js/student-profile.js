import { firebaseReady } from '../firebase/firebase-client.js';
import { calculateAcademicGrade, formatGrade, publishedScore } from './academic-model.js';

const root = document.querySelector('[data-student-profile]');
const details = document.querySelector('[data-student-profile-details]');
const safe = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
const labelDate = (value) => { if (!value) return 'A definir pela coordenação'; const date = value.toDate ? value.toDate() : new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? 'A definir pela coordenação' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date); };
const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const percent = (value) => value === null ? 'N/A' : `${Math.round(value)}%`;

if (firebaseReady && root) {
  const { auth, authSdk, db, firestoreSdk } = await firebaseReady;
  const { collection, doc, getDocFromServer, getDocs, query, where } = firestoreSdk;
  authSdk.onAuthStateChanged(auth, async (user) => {
    if (!user) { root.innerHTML = '<p class="eyebrow">Meu perfil</p><h1>Entre para continuar.</h1><p class="lede">Use o acesso de aluno ou professor na tela de login.</p>'; return; }
    try {
      const [staffSnapshot, studentSnapshot, progressSnapshot, activitySnapshot, projectsSnapshot, assessmentSnapshot] = await Promise.all([
        getDocFromServer(doc(db, 'staff', user.uid)), getDocFromServer(doc(db, 'students', user.uid)),
        getDocFromServer(doc(db, 'students', user.uid, 'progress', 'catalog')), getDocs(collection(db, 'students', user.uid, 'activities')),
        getDocs(collection(db, 'students', user.uid, 'projects')), getDocs(query(collection(db, 'assessments'), where('published', '==', true)))
      ]);
      const isStaff = staffSnapshot.exists() && staffSnapshot.data().active === true;
      if (!isStaff && (!studentSnapshot.exists() || studentSnapshot.data().enrollmentStatus !== 'paid')) { root.innerHTML = '<p class="eyebrow">Meu perfil</p><h1>Matrícula em validação.</h1><p class="lede">Assim que a compra ou o cadastro da equipe for confirmado, sua formação será liberada aqui.</p>'; return; }
      const student = studentSnapshot.exists() ? studentSnapshot.data() : {};
      const progress = progressSnapshot.exists() ? progressSnapshot.data() : {};
      const completedLessons = Array.isArray(progress.completedLessons) ? progress.completedLessons.length : 0;
      const lessonTotal = Number(progress.totalLessons || 162);
      const courseProgress = Math.round((completedLessons / lessonTotal) * 100);
      const activities = activitySnapshot.docs.map((entry) => entry.data());
      const activityScores = activities.map(publishedScore).filter((item) => item !== null);
      const submissions = await Promise.all(assessmentSnapshot.docs.map(async (assessment) => { const submission = await getDocFromServer(doc(db, 'assessments', assessment.id, 'submissions', user.uid)); return submission.exists() ? submission.data() : null; }));
      const assessmentScores = submissions.map(publishedScore).filter((value) => value !== null);
      const projects = projectsSnapshot.docs.map((entry) => entry.data());
      const continuous = projects.find((item) => item.kind === 'continuous');
      const finalProject = projects.find((item) => item.kind === 'final');
      const academicGrade = calculateAcademicGrade({ assessmentScores, activityScores, continuousScore:publishedScore(continuous), finalScore:publishedScore(finalProject) });
      const grade = academicGrade.partial;
      const name = isStaff ? (staffSnapshot.data().name || user.displayName || 'Professor(a)') : (student.name || user.displayName || 'Aluno(a)');
      root.innerHTML = `<p class="eyebrow">${isStaff ? 'Visualização docente' : 'Meu perfil acadêmico'}</p><h1>${safe(name)}</h1><p class="lede">${isStaff ? 'Prévia da experiência acadêmica. Nenhum registro é criado na sua conta docente.' : 'Seu progresso, suas entregas e sua média são atualizados conforme você avança.'}</p>`;
      details.hidden = false;
      details.innerHTML = `<article class="profile-stat"><span>Conclusão do curso</span><strong>${courseProgress}%</strong><small>${completedLessons} de ${lessonTotal} aulas concluídas</small></article><article class="profile-stat"><span>Média parcial ponderada</span><strong>${formatGrade(grade)}</strong><small>${grade === null ? 'N/A até existir uma nota publicada' : `${academicGrade.availableWeight}% dos componentes avaliados`}</small></article><article><span>Média das avaliações</span><strong>${formatGrade(average(assessmentScores))}</strong><small>${assessmentScores.length} nota(s) publicada(s) · peso 55%</small></article><article><span>Atividades de aula</span><strong>${activitySnapshot.size}</strong><small>Média ${formatGrade(average(activityScores))} · peso 10%</small></article><article><span>Projeto 1</span><strong>${continuous?.score ?? 'N/A'}</strong><small>${continuous?.status === 'graded' ? 'Nota publicada · peso 15%' : 'Inicia na Aula 2 do M01'}</small></article><article><span>Projeto 2 — TCC final</span><strong>${finalProject?.score ?? 'N/A'}</strong><small>${finalProject?.status === 'graded' ? 'Nota publicada · peso 20%' : 'Libera no M19'}</small></article><article><span>Plano contratado</span><strong>${safe(student.plan || (isStaff ? 'Visualização' : 'Em validação'))}</strong><small>Início: ${safe(labelDate(student.courseStart))}</small></article><article><span>Status da matrícula</span><strong class="profile-status profile-status--ok">${isStaff ? 'Prévia docente' : 'Ativa'}</strong><small>${safe(user.email || '—')}</small></article><a class="profile-report-link" href="boletim.html"><span>Boletim completo</span><strong>Ver notas por módulo →</strong></a>`;
    } catch (error) { root.innerHTML = `<p class="eyebrow">Meu perfil</p><h1>Não foi possível carregar o perfil.</h1><p class="lede">Código Firebase: ${safe(error?.code || 'erro-desconhecido')}. Atualize as regras do Firestore e tente novamente.</p>`; }
  });
}
