import { firebaseReady } from '../firebase/firebase-client.js';

const root = document.querySelector('[data-student-profile]');
const details = document.querySelector('[data-student-profile-details]');
const safe = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[char]));
const labelDate = (value) => {
  if (!value) return 'A definir pela coordenação';
  const date = value.toDate ? value.toDate() : new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? 'A definir pela coordenação' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
};

if (firebaseReady && root) {
  const { auth, authSdk, db, firestoreSdk } = await firebaseReady;
  authSdk.onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const snapshot = await firestoreSdk.getDoc(firestoreSdk.doc(db, 'students', user.uid));
    const student = snapshot.exists() ? snapshot.data() : {};
    const name = student.name || user.displayName || 'Aluno(a)';
    root.innerHTML = `<p class="eyebrow">Meu perfil</p><h1>${safe(name)}</h1><p class="lede">Aqui estão os dados da sua matrícula e os canais acadêmicos da sua formação.</p>`;
    details.hidden = false;
    details.innerHTML = `<article><span>Conta Google</span><strong>${safe(user.email || '—')}</strong></article><article><span>Plano contratado</span><strong>${safe(student.plan || 'Em validação')}</strong></article><article><span>Status da matrícula</span><strong class="profile-status ${student.enrollmentStatus === 'paid' ? 'profile-status--ok' : ''}">${student.enrollmentStatus === 'paid' ? 'Ativa' : safe(student.enrollmentStatus || 'Em validação')}</strong></article><article><span>Início da turma</span><strong>${safe(labelDate(student.courseStart))}</strong></article>`;
  });
}
