import { firebaseConfig } from './firebase-config.js';

const status = document.querySelector('[data-firebase-status]');
const login = document.querySelector('[data-google-login]');
const logout = document.querySelector('[data-firebase-logout]');
const configured = firebaseConfig?.apiKey && !firebaseConfig.apiKey.startsWith('COLE_');
const setStatus = (text) => { if (status) status.textContent = text; };
const target = new URLSearchParams(window.location.search).get('target');
const destination = target === 'teacher' ? '../professor/index.html' : '../aluno/index.html';
const requestedStatus = new URLSearchParams(window.location.search).get('status');

if (!configured) {
  setStatus('O acesso será liberado após a configuração do Firebase pelo administrador.');
  login?.setAttribute('disabled', '');
} else {
  const [{ initializeApp }, { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut }] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js')
  ]);
  const auth = getAuth(initializeApp(firebaseConfig));
  const provider = new GoogleAuthProvider();
  login?.addEventListener('click', async () => { try {
    const result = await signInWithPopup(auth, provider);
    if (target !== 'teacher') {
      try {
        const idToken = await result.user.getIdToken();
        await fetch('../api/claim-enrollment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
      } catch { /* A Área do Aluno confirma a matrícula no Firestore após o redirecionamento. */ }
    }
    window.location.assign(destination);
  } catch (error) { setStatus('Não foi possível concluir o login. Verifique os domínios autorizados no Firebase.'); } });
  logout?.addEventListener('click', () => signOut(auth));
  onAuthStateChanged(auth, (user) => { if (user) { setStatus(requestedStatus === 'enrollment' ? 'Sua conta Google está ativa. A matrícula será liberada após a confirmação da compra na Hotmart.' : `Sessão ativa: ${user.displayName || user.email}`); login?.setAttribute('hidden', ''); logout?.removeAttribute('hidden'); } else { setStatus('Entre com Google para acessar sua formação.'); login?.removeAttribute('hidden'); logout?.setAttribute('hidden', ''); } });
}
