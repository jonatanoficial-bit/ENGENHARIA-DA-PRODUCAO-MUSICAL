import { firebaseReady } from './firebase-client.js';

const root = document.documentElement.dataset.root || './';
const portalLink = () => document.querySelector('[data-portal-link]');
const setPortal = (href, label) => {
  const link = portalLink();
  if (!link) return;
  link.href = href;
  link.textContent = label;
};

setPortal(`${root}pages/login.html`, 'Entrar na plataforma');

if (firebaseReady) {
  const { auth, authSdk, db, firestoreSdk } = await firebaseReady;
  authSdk.onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try {
      const staff = await firestoreSdk.getDoc(firestoreSdk.doc(db, 'staff', user.uid));
      if (staff.exists() && staff.data().active === true) {
        setPortal(`${root}professor/index.html`, 'Área do professor');
        return;
      }
      const student = await firestoreSdk.getDoc(firestoreSdk.doc(db, 'students', user.uid));
      if (student.exists() && student.data().enrollmentStatus === 'paid') {
        setPortal(`${root}aluno/index.html`, 'Área do aluno');
      }
    } catch {
      // Mantém o acesso de login até que o Firebase responda.
    }
  });
}
