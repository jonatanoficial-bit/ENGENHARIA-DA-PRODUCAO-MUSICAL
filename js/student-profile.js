import { firebaseReady } from '../firebase/firebase-client.js';

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
      const activityScore = activitySnapshot.size ? Math.round((activitySnapshot.size / lessonTotal) * 100) : null;
      const submissions = await Promise.all(assessmentSnapshot.docs.map(async (assessment) => { const submission = await getDocFromServer(doc(db, 'assessments', assessment.id, 'submissions', user.uid)); return submission.exists() ? submission.data() : null; }));
      const assessmentScores = submissions.filter((item) => item?.status === 'graded' && Number.isFinite(Number(item.score))).map((item) => Number(item.score));
      const projects = projectsSnapshot.docs.map((entry) => entry.data());
      const continuous = projects.find((item) => item.kind === 'continuous');
      const finalProject = projects.find((item) => item.kind === 'final');
      const components = [
        { value: average(assessmentScores), weight: 55 },
        { value: activityScore, weight: 10 },
        { value: Number.isFinite(Number(continuous?.score)) ? Number(continuous.score) : null, weight: 15 },
        { value: Number.isFinite(Number(finalProject?.score)) ? Number(finalProject.score) : null, weight: 20 }
      ].filter((item) => item.value !== null);
      const grade = assessmentScores.length || projects.some((item) => Number.isFinite(Number(item.score))) ? components.reduce((sum, item) => sum + item.value * item.weight, 0) / components.reduce((sum, item) => sum + item.weight, 0) : null;
      const name = isStaff ? (staffSnapshot.data().name || user.displayName || 'Professor(a)') : (student.name || user.displayName || 'Aluno(a)');
      root.innerHTML = `<p class="eyebrow">${isStaff ? 'Visualização docente' : 'Meu perfil acadêmico'}</p><h1>${safe(name)}</h1><p class="lede">${isStaff ? 'Prévia da experiência acadêmica. Nenhum registro é criado na sua conta docente.' : 'Seu progresso, suas entregas e sua média são atualizados conforme você avança.'}</p>`;
      details.hidden = false;
      details.innerHTML = `<article class="profile-stat"><span>Conclusão do curso</span><strong>${courseProgress}%</strong><small>${completedLessons} de ${lessonTotal} aulas concluídas</small></article><article class="profile-stat"><span>Média geral ponderada</span><strong>${percent(grade)}</strong><small>${grade === null ? 'N/A até existir uma nota publicada' : 'Avaliações, atividades e trabalhos'}</small></article><article><span>Média das avaliações</span><strong>${percent(average(assessmentScores))}</strong><small>${assessmentScores.length} nota(s) publicada(s)</small></article><article><span>Atividades de aula</span><strong>${activitySnapshot.size}</strong><small>${activityScore === null ? 'Ainda não registradas' : `${activityScore}% da trilha concluído`}</small></article><article><span>Projeto contínuo</span><strong>${continuous?.score ?? 'N/A'}</strong><small>${continuous?.status === 'graded' ? 'Nota publicada' : 'Inicia na Aula 2 do M01'}</small></article><article><span>Projeto final</span><strong>${finalProject?.score ?? 'N/A'}</strong><small>${finalProject?.status === 'graded' ? 'Nota publicada' : 'Libera no M19'}</small></article><article><span>Plano contratado</span><strong>${safe(student.plan || (isStaff ? 'Visualização' : 'Em validação'))}</strong><small>Início: ${safe(labelDate(student.courseStart))}</small></article><article><span>Status da matrícula</span><strong class="profile-status profile-status--ok">${isStaff ? 'Prévia docente' : 'Ativa'}</strong><small>${safe(user.email || '—')}</small></article>`;
    } catch (error) { root.innerHTML = `<p class="eyebrow">Meu perfil</p><h1>Não foi possível carregar o perfil.</h1><p class="lede">Código Firebase: ${safe(error?.code || 'erro-desconhecido')}. Atualize as regras do Firestore e tente novamente.</p>`; }
  });
}
