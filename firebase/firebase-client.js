import { firebaseConfig } from './firebase-config.js';

const configured = firebaseConfig?.apiKey && !firebaseConfig.apiKey.startsWith('COLE_');

export const firebaseReady = configured ? (async () => {
  const [appSdk, authSdk, firestoreSdk] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js'),
    import('https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js')
  ]);
  const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(firebaseConfig);
  // Long polling forçado é mais tolerante a redes móveis, proxies e bloqueios de WebChannel.
  const db = firestoreSdk.initializeFirestore(app, {
    experimentalForceLongPolling: true,
    useFetchStreams: false
  }, firebaseConfig.firestoreDatabaseId || '(default)');
  return { auth: authSdk.getAuth(app), authSdk, db, firestoreSdk };
})() : null;

export const isFirebaseConfigured = Boolean(configured);
