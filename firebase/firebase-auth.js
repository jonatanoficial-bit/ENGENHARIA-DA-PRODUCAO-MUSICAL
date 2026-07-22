import { firebaseConfig } from './firebase-config.js';

const status = document.querySelector('[data-firebase-status]');
const login = document.querySelector('[data-google-login]');
const logout = document.querySelector('[data-firebase-logout]');
const configured = firebaseConfig?.apiKey && !firebaseConfig.apiKey.startsWith('COLE_');
const setStatus = (text) => { if (status) status.textContent = text; };

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
  login?.addEventListener('click', async () => { try { await signInWithPopup(auth, provider); window.location.assign('../aluno/index.html'); } catch (error) { setStatus('Não foi possível concluir o login. Verifique os domínios autorizados no Firebase.'); } });
  logout?.addEventListener('click', () => signOut(auth));
  onAuthStateChanged(auth, (user) => { if (user) { setStatus(`Sessão ativa: ${user.displayName || user.email}`); login?.setAttribute('hidden', ''); logout?.removeAttribute('hidden'); } else { setStatus('Entre com Google para acessar sua formação.'); login?.removeAttribute('hidden'); logout?.setAttribute('hidden', ''); } });
}
