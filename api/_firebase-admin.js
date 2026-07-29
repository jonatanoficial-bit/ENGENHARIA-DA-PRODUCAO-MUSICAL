const admin = require('firebase-admin');

function serviceAccount() {
  const rawJson = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
  if (rawJson) {
    try {
      const account = JSON.parse(rawJson);
      if (account.project_id && account.client_email && account.private_key) {
        return {
          projectId: account.project_id,
          clientEmail: account.client_email,
          privateKey: String(account.private_key).replace(/\\n/g, '\n')
        };
      }
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON contains invalid JSON.');
    }
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is incomplete.');
  }

  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    throw new Error('Firebase Admin environment variables are missing.');
  }
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey
  };
}

function getAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount()) });
  }
  return admin;
}

function getDb() {
  return getAdmin().firestore(process.env.FIRESTORE_DATABASE_ID || 'default');
}

module.exports = { getAdmin, getDb };
