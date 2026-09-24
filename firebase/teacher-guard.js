import { firebaseReady } from './firebase-client.js';

const notice = document.querySelector('[data-teacher-gate]');
const appContent = document.querySelector('[data-teacher-content]');
const show = (text) => { if (notice) notice.textContent = text; };

if (!firebaseReady) {
  show('O Firebase ainda não foi configurado. Consulte o guia de configuração.');
} else {
  const { auth, authSdk, db, firestoreSdk } = await firebaseReady;
  authSdk.onAuthStateChanged(auth, async (user) => {
    if (appContent) appContent.hidden = true;
    if (notice) notice.hidden = false;
    delete window.empTeacherSession;
    if (!user) {
      window.location.replace('../pages/login.html?status=login');
      return;
    }
    try {
      const staff = await firestoreSdk.getDocFromServer(firestoreSdk.doc(db, 'staff', user.uid));
      if (auth.currentUser?.uid !== user.uid) return;
      if (!staff.exists() || staff.data().active !== true) {
        show(`A conta ${user.email || ''} está autenticada, mas ainda não possui perfil de professor. Peça ao administrador para criar staff/${user.uid} no Firestore.`);
        return;
      }
      document.documentElement.dataset.staffRole = staff.data().role || 'teacher';
      window.empTeacherSession = { user, staff: staff.data() };
      document.dispatchEvent(new CustomEvent('teacher:authorized', { detail: window.empTeacherSession }));
      if (notice) notice.hidden = true;
      if (appContent) appContent.hidden = false;
    } catch (error) {
      const code = error?.code || 'erro-desconhecido';
      show(`Não foi possível validar o perfil docente. Código Firebase: ${code}. Confirme que a regra publicada permite "get" em staff e tente novamente.`);
    }
  });
}
