import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

const isConfigured = firebaseConfig?.apiKey && !firebaseConfig.apiKey.startsWith('COLE_');
const status = document.querySelector('[data-firebase-status]');
const googleButton = document.querySelector('[data-google-login]');
const logoutButton = document.querySelector('[data-firebase-logout]');
const userName = document.querySelector('[data-firebase-user]');

const show = (message) => { if (status) status.textContent = message; };
if (!isConfigured) {
  show('Firebase ainda não configurado. Consulte FIREBASE-SETUP.txt antes de ativar o login Google.');
  googleButton?.setAttribute('disabled', '');
} else {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  googleButton?.addEventListener('click', async () => { try { await signInWithPopup(auth, provider); } catch (error) { show(`Não foi possível entrar: ${error.code}. Verifique os domínios autorizados no Firebase.`); } });
  logoutButton?.addEventListener('click', () => signOut(auth));
  onAuthStateChanged(auth, (user) => { if (user) { show('Login Google ativo.'); if (userName) userName.textContent = user.displayName || user.email; googleButton?.setAttribute('hidden', ''); logoutButton?.removeAttribute('hidden'); } else { show('Entre com sua conta Google para sincronizar seu acesso.'); googleButton?.removeAttribute('hidden'); logoutButton?.setAttribute('hidden', ''); } });
}
