import { firebaseReady } from '../firebase/firebase-client.js';

const assessmentRoot = document.querySelector('[data-teacher-assessments]');
const driveRoot = document.querySelector('[data-drive-workspace]');
const generalDriveFolderUrl = 'https://drive.google.com/drive/folders/12bmLthE4F7Mfe6lFlD0cGxiPjNFKZD0a?usp=sharing';
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));

if (driveRoot) {
  driveRoot.innerHTML = `<a class="button" href="${generalDriveFolderUrl}" target="_blank" rel="noopener">Abrir pasta geral de trabalhos no Google Drive</a>`;
}

if (firebaseReady && assessmentRoot) {
  const { auth, authSdk, db, firestoreSdk } = await firebaseReady;
  const { collection, doc, getDoc, getDocs, query, where, setDoc, addDoc, serverTimestamp } = firestoreSdk;
  authSdk.onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try {
      const [assessmentSnapshot, studentSnapshot, staffSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'assessments'), where('published', '==', true))),
        getDoc(doc(db, 'students', user.uid)),
        getDoc(doc(db, 'staff', user.uid))
      ]);
      const staffPreview = staffSnapshot.exists() && staffSnapshot.data().active === true;
      const assessments = await Promise.all(assessmentSnapshot.docs.map(async (entry) => { const submission = await getDoc(doc(db, 'assessments', entry.id, 'submissions', user.uid)); return { id: entry.id, ...entry.data(), submission: submission.exists() ? submission.data() : null }; }));
      assessmentRoot.innerHTML = assessments.length ? `<p class="eyebrow">Provas publicadas pelo professor</p><h2>Avaliações integradas à sua trilha.</h2>${staffPreview ? '<p class="course-alert"><strong>Visualização docente:</strong> as questões estão visíveis, mas nenhuma resposta, nota ou tentativa será registrada nesta conta.</p>' : ''}<div class="student-assessment-list">${assessments.map((assessment) => { const question = assessment.questions?.[0]; const result = assessment.submission?.status === 'graded' ? `<p class="form-feedback ${assessment.submission.passed ? 'form-feedback--ok' : 'form-feedback--error'}">Nota publicada: ${escapeHtml(assessment.submission.score)}% · ${assessment.submission.passed ? 'Aprovado' : 'Revisar o módulo'}</p>` : assessment.submission ? '<p class="form-feedback">Resposta enviada · aguardando correção.</p>' : ''; const preview = `<div class="student-assessment__preview"><p>${escapeHtml(question?.prompt || '')}</p><p class="form-feedback">Visualização somente para conferência pedagógica.</p></div>`; return question ? `<article class="student-assessment"><div><strong>${escapeHtml(assessment.title)}</strong><span>${escapeHtml(assessment.module)} · nota mínima ${escapeHtml(assessment.passScore)}%</span></div>${staffPreview ? preview : `<form data-student-assessment="${assessment.id}"><fieldset><legend>${escapeHtml(question.prompt)}</legend>${question.options.map((option) => `<label><input type="radio" required name="answer" value="${escapeHtml(option)}"> ${escapeHtml(option)}</label>`).join('')}</fieldset><button class="button button--quiet" type="submit">Enviar resposta</button><p class="form-feedback"></p>${result}</form>`}</article>` : ''; }).join('')}</div>` : '<p class="eyebrow">Provas publicadas pelo professor</p><h2>Avaliações integradas à sua trilha.</h2><p>Nenhuma avaliação foi publicada para sua turma ainda.</p>';
      assessmentRoot.querySelectorAll('[data-student-assessment]').forEach((form) => form.addEventListener('submit', async (event) => {
        event.preventDefault(); const assessment = assessments.find((item) => item.id === form.dataset.studentAssessment); const answer = new FormData(form).get('answer'); const feedback = form.querySelector('.form-feedback');
        try {
          await setDoc(doc(db, 'assessments', assessment.id, 'submissions', user.uid), { studentName: user.displayName || '', studentEmail: user.email || '', studentId: user.uid, answer, status: 'submitted', submittedAt: serverTimestamp() }, { merge: true });
          feedback.textContent = 'Resposta enviada. O professor fará a correção e publicará sua nota neste painel.'; feedback.className = 'form-feedback form-feedback--ok';
        } catch { feedback.textContent = 'Não foi possível registrar sua resposta. Tente novamente ou avise a equipe.'; feedback.className = 'form-feedback form-feedback--error'; }
      }));
      const folder = studentSnapshot.exists() ? studentSnapshot.data().driveFolderUrl : '';
      if (driveRoot) driveRoot.innerHTML = `<a class="button" href="${escapeHtml(folder || generalDriveFolderUrl)}" target="_blank" rel="noopener">${folder ? 'Abrir minha pasta no Google Drive' : 'Abrir pasta geral de trabalhos no Google Drive'}</a>`;
      const mentorshipSection = document.querySelector('[data-student-request]');
      if (staffPreview && mentorshipSection) {
        mentorshipSection.innerHTML = '<div><p class="eyebrow">Agendamento</p><h2>Solicitação indisponível na visualização docente.</h2><p>Utilize o painel do professor para acompanhar e responder às mentorias dos alunos.</p></div>';
        return;
      }
      document.querySelector('[data-mentorship-request]')?.addEventListener('submit', async (event) => {
        event.preventDefault(); const form = event.currentTarget; const feedback = form.querySelector('.form-feedback'); const data = new FormData(form);
        try { await addDoc(collection(db, 'mentorshipRequests'), { studentId: user.uid, studentName: user.displayName || '', studentEmail: user.email || '', topic: data.get('topic').trim(), availability: data.get('availability').trim(), status: 'pending', createdAt: serverTimestamp() }); form.reset(); feedback.textContent = 'Solicitação enviada para a equipe.'; feedback.className = 'form-feedback form-feedback--ok'; }
        catch { feedback.textContent = 'Não foi possível enviar agora. Tente novamente.'; feedback.className = 'form-feedback form-feedback--error'; }
      });
    } catch {
      assessmentRoot.innerHTML = '<p class="eyebrow">Avaliações</p><h2>Configuração acadêmica em andamento.</h2><p>As avaliações serão exibidas aqui após a ativação do Firestore e das regras de acesso.</p>';
    }
  });
}
