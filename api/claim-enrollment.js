const crypto = require('crypto');
const { getAdmin, getDb } = require('./_firebase-admin');
const emailKey = (email) => crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex');

// O webhook grava a venda aprovada e a matrícula por e-mail. Esta recuperação
// idempotente cobre entregas antigas que tenham registrado a venda, mas não
// tenham concluído a matrícula por e-mail antes do primeiro login do aluno.
async function findApprovedSale(db, email) {
  const sales = await db.collection('sales').where('buyerEmail', '==', email).limit(20).get();
  return sales.docs
    .map((document) => document.data())
    .find((sale) => sale.status === 'approved');
}

module.exports = async (request, response) => {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido' });
  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : (request.body || {});
    if (!body.idToken) return response.status(400).json({ error: 'Token de acesso ausente' });
    const admin = getAdmin(); const decoded = await admin.auth().verifyIdToken(body.idToken);
    const email = String(decoded.email || '').trim().toLowerCase();
    if (!email) return response.status(403).json({ error: 'A conta Google não possui e-mail' });
    const db = getDb(); const enrollmentRef = db.collection('enrollments').doc(emailKey(email)); const enrollmentSnapshot = await enrollmentRef.get();
    const now = admin.firestore.FieldValue.serverTimestamp();
    let enrollment = enrollmentSnapshot.exists ? enrollmentSnapshot.data() : null;
    let recovered = false;

    if (!enrollment || enrollment.enrollmentStatus !== 'paid') {
      const sale = await findApprovedSale(db, email);
      if (!sale) return response.status(403).json({ status: 'pending' });
      enrollment = {
        email,
        buyerName: sale.buyerName || decoded.name || '',
        plan: sale.plan || 'curso',
        offerCode: sale.offerCode || '',
        offerName: sale.offerName || '',
        enrollmentStatus: 'paid',
        latestTransaction: sale.transaction || '',
        approvedAt: sale.approvedAt || now,
        recoveredAt: now,
        updatedAt: now
      };
      await enrollmentRef.set(enrollment, { merge: true });
      recovered = true;
    }

    await db.collection('students').doc(decoded.uid).set({ name: decoded.name || enrollment.buyerName || '', email, plan: enrollment.plan || 'curso', enrollmentStatus: 'paid', courseStart: enrollment.courseStart || '', enrollmentId: enrollmentRef.id, latestTransaction: enrollment.latestTransaction || '', updatedAt: now, claimedAt: now }, { merge: true });
    return response.status(200).json({ status: 'paid', plan: enrollment.plan || 'curso', recovered });
  } catch (error) {
    console.error('Erro ao vincular matrícula', error);
    const isConfigurationError = /Firebase Admin|FIREBASE_SERVICE_ACCOUNT_JSON/.test(String(error?.message || ''));
    return response.status(isConfigurationError ? 503 : 500).json({ error: isConfigurationError ? 'Integração do Firebase Admin pendente na Vercel' : 'Não foi possível validar a matrícula' });
  }
};
