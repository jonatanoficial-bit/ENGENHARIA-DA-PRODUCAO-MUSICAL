import { firebaseConfig } from './firebase-config.js';

const configured = firebaseConfig?.apiKey && !firebaseConfig.apiKey.startsWith('COLE_');
if (!configured) {
  window.location.replace('../pages/login.html?status=configure');
} else {
  const [{ initializeApp }, { getAuth, onAuthStateChanged }] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js')
  ]);
  const auth = getAuth(initializeApp(firebaseConfig));
  onAuthStateChanged(auth, (user) => { if (!user) window.location.replace('../pages/login.html?status=login'); });
}
