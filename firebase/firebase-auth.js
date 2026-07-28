import { firebaseReady } from './firebase-client.js';

const status = document.querySelector('[data-firebase-status]');
const loginButtons = [...document.querySelectorAll('[data-google-login]')];
const logout = document.querySelector('[data-firebase-logout]');
const requestedStatus = new URLSearchParams(window.location.search).get('status');
const setStatus = (text) => { if (status) status.textContent = text; };
const setLoading = (busy) => loginButtons.forEach((button) => {
  button.disabled = busy;
  button.setAttribute('aria-busy', String(busy));
});

const sendToStudent = async (user) => {
  try {
    const idToken = await user.getIdToken();
    await fetch('../api/claim-enrollment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
  } catch {
    // A proteção da Área do Aluno verifica a matrícula novamente no Firestore.
  }
  window.location.assign('../aluno/index.html');
};

if (!firebaseReady) {
  setStatus('O acesso será liberado após a configuração do Firebase pelo administrador.');
  setLoading(true);
} else {
  const { auth, authSdk, db, firestoreSdk } = await firebaseReady;
  const provider = new authSdk.GoogleAuthProvider();

  const routeSignedInUser = async (user, requestedRole) => {
    try {
      const staff = await firestoreSdk.getDoc(firestoreSdk.doc(db, 'staff', user.uid));
      const isTeacher = staff.exists() && staff.data().active === true;
      if (requestedRole === 'teacher') {
        if (isTeacher) {
          window.location.assign('../professor/index.html');
          return;
        }
        setStatus(`A conta ${user.email || ''} não possui um perfil docente ativo. Entre como aluno ou peça à administração para conferir o seu UID no Firebase.`);
        setLoading(false);
        return;
      }
      if (isTeacher) {
        window.location.assign('../professor/index.html');
        return;
      }
      await sendToStudent(user);
    } catch (error) {
      setStatus(`Não foi possível confirmar o perfil no Firebase. Código: ${error?.code || 'erro-desconhecido'}.`);
      setLoading(false);
    }
  };

  loginButtons.forEach((button) => button.addEventListener('click', async () => {
    const requestedRole = button.dataset.accessTarget || 'student';
    setLoading(true);
    setStatus('Abrindo o login Google…');
    try {
      const result = await authSdk.signInWithPopup(auth, provider);
      await routeSignedInUser(result.user, requestedRole);
    } catch (error) {
      setStatus(`Não foi possível concluir o login. Código: ${error?.code || 'erro-desconhecido'}. Verifique os domínios autorizados no Firebase.`);
      setLoading(false);
    }
  }));

  logout?.addEventListener('click', async () => {
    await authSdk.signOut(auth);
    setStatus('Sessão encerrada. Escolha o acesso desejado.');
  });

  authSdk.onAuthStateChanged(auth, (user) => {
    if (user) {
      setStatus(requestedStatus === 'enrollment'
        ? 'Sua conta Google está ativa. A matrícula será liberada após a confirmação da compra na Hotmart.'
        : `Sessão ativa: ${user.displayName || user.email}. Escolha abaixo o painel que deseja acessar.`);
      logout?.removeAttribute('hidden');
    } else {
      setStatus('Escolha o acesso de aluno ou professor para continuar.');
      logout?.setAttribute('hidden', '');
    }
  });
}
