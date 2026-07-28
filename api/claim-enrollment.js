const crypto = require('crypto');
const { getAdmin, getDb } = require('./_firebase-admin');
const emailKey = (email) => crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex');

module.exports = async (request, response) => {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido' });
  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : (request.body || {});
    if (!body.idToken) return response.status(400).json({ error: 'Token de acesso ausente' });
    const admin = getAdmin(); const decoded = await admin.auth().verifyIdToken(body.idToken);
    const email = String(decoded.email || '').trim().toLowerCase();
    if (!email) return response.status(403).json({ error: 'A conta Google não possui e-mail' });
    const db = getDb(); const enrollmentRef = db.collection('enrollments').doc(emailKey(email)); const enrollmentSnapshot = await enrollmentRef.get();
    if (!enrollmentSnapshot.exists || enrollmentSnapshot.data().enrollmentStatus !== 'paid') return response.status(403).json({ status: 'pending' });
    const enrollment = enrollmentSnapshot.data(); const now = admin.firestore.FieldValue.serverTimestamp();
    await db.collection('students').doc(decoded.uid).set({ name: decoded.name || enrollment.buyerName || '', email, plan: enrollment.plan || 'curso', enrollmentStatus: 'paid', courseStart: enrollment.courseStart || '', enrollmentId: enrollmentRef.id, latestTransaction: enrollment.latestTransaction || '', updatedAt: now, claimedAt: now }, { merge: true });
    return response.status(200).json({ status: 'paid', plan: enrollment.plan || 'curso' });
  } catch (error) {
    console.error('Erro ao vincular matrícula', error);
    return response.status(500).json({ error: 'Não foi possível validar a matrícula' });
  }
};
