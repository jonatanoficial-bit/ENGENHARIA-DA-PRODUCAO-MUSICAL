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
    if (!user) {
      root.innerHTML = '<p class="eyebrow">Meu perfil</p><h1>Entre para continuar.</h1><p class="lede">Use o acesso de aluno ou professor na tela de login.</p>';
      return;
    }
    try {
      const [staffSnapshot, studentSnapshot] = await Promise.all([
        firestoreSdk.getDoc(firestoreSdk.doc(db, 'staff', user.uid)),
        firestoreSdk.getDoc(firestoreSdk.doc(db, 'students', user.uid))
      ]);
      if (staffSnapshot.exists() && staffSnapshot.data().active === true) {
        window.location.replace('../professor/index.html');
        return;
      }
      if (!studentSnapshot.exists() || studentSnapshot.data().enrollmentStatus !== 'paid') {
        root.innerHTML = '<p class="eyebrow">Meu perfil</p><h1>Matrícula em validação.</h1><p class="lede">Assim que a compra for confirmada pela Hotmart, sua formação e seu perfil serão liberados aqui.</p>';
        return;
      }
      const student = studentSnapshot.data();
      const name = student.name || user.displayName || 'Aluno(a)';
      root.innerHTML = `<p class="eyebrow">Meu perfil</p><h1>${safe(name)}</h1><p class="lede">Aqui estão os dados da sua matrícula e os canais acadêmicos da sua formação.</p>`;
      details.hidden = false;
      details.innerHTML = `<article><span>Conta Google</span><strong>${safe(user.email || '—')}</strong></article><article><span>Plano contratado</span><strong>${safe(student.plan || 'Em validação')}</strong></article><article><span>Status da matrícula</span><strong class="profile-status profile-status--ok">Ativa</strong></article><article><span>Início da turma</span><strong>${safe(labelDate(student.courseStart))}</strong></article>`;
    } catch (error) {
      root.innerHTML = `<p class="eyebrow">Meu perfil</p><h1>Não foi possível carregar o perfil.</h1><p class="lede">Código Firebase: ${safe(error?.code || 'erro-desconhecido')}. Atualize as regras do Firestore e tente novamente.</p>`;
    }
  });
}
