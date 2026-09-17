const crypto = require('crypto');
const { getDb, getFirebaseAuth, serverTimestamp } = require('./_firebase-admin');
const emailKey = (email) => crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex');

// O webhook grava a venda aprovada e a matrícula por e-mail. Esta recuperação
// idempotente cobre entregas antigas que tenham registrado a venda, mas não
// tenham concluído a matrícula por e-mail antes do primeiro login do aluno.
async function findApprovedSale(db, email, transaction) {
  const sales = await transaction.get(db.collection('sales').where('buyerEmail', '==', email));
  return sales.docs
    .map((document) => document.data())
    .find((sale) => sale.status === 'approved');
}

module.exports = async (request, response) => {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido' });
  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : (request.body || {});
    if (!body.idToken) return response.status(400).json({ error: 'Token de acesso ausente' });
    const decoded = await getFirebaseAuth().verifyIdToken(body.idToken);
    const email = String(decoded.email || '').trim().toLowerCase();
    if (!email) return response.status(403).json({ error: 'A conta Google não possui e-mail' });
    const db = getDb(); const enrollmentRef = db.collection('enrollments').doc(emailKey(email));
    const result = await db.runTransaction(async (transaction) => {
      const studentRef = db.collection('students').doc(decoded.uid);
      const [enrollmentSnapshot, studentSnapshot] = await Promise.all([transaction.get(enrollmentRef), transaction.get(studentRef)]);
      const student = studentSnapshot.exists ? studentSnapshot.data() : {};
      const now = serverTimestamp();
      let enrollment = enrollmentSnapshot.exists ? enrollmentSnapshot.data() : null;
      let recovered = false;
      // A known revocation must not be undone by an old approved sale or manual record.
      if (enrollment?.enrollmentStatus === 'blocked') {
        if (studentSnapshot.exists) transaction.set(studentRef, { enrollmentStatus:'blocked', updatedAt:now }, { merge:true });
        return { status:'blocked' };
      }

      if (!enrollment || enrollment.enrollmentStatus !== 'paid') {
        const manualSnapshot = await transaction.get(db.collection('manualEnrollments').doc(emailKey(email)));
        if (manualSnapshot.exists && manualSnapshot.data().enrollmentStatus === 'paid') {
          const manual = manualSnapshot.data();
          enrollment = { email, buyerName: manual.name || decoded.name || '', plan: manual.plan || 'curso', enrollmentStatus: 'paid', courseStart: manual.courseStart || '', paymentMode: manual.paymentMode || 'team-direct', source: 'team-direct', updatedAt: now };
          recovered = true;
        }
      }

      if (!enrollment || enrollment.enrollmentStatus !== 'paid') {
        const sale = await findApprovedSale(db, email, transaction);
        if (!sale) return { status: 'pending' };
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
        recovered = true;
      }

      if (recovered) transaction.set(enrollmentRef, enrollment, { merge:true });
      transaction.set(studentRef, { name: student.name || decoded.name || enrollment.buyerName || '', email, plan: enrollment.plan || 'curso', enrollmentStatus: 'paid', courseStart: student.courseStart || enrollment.courseStart || '', enrollmentId: enrollmentRef.id, latestTransaction: enrollment.latestTransaction || '', updatedAt: now, claimedAt: student.claimedAt || now }, { merge: true });
      return { status: 'paid', plan: enrollment.plan || 'curso', recovered };
    });
    response.setHeader('Cache-Control', 'no-store');
    return response.status(result.status === 'paid' ? 200 : 403).json(result);
  } catch (error) {
    console.error('Erro ao vincular matrícula', error);
    const isConfigurationError = /Firebase Admin|FIREBASE_SERVICE_ACCOUNT_JSON/.test(String(error?.message || ''));
    return response.status(isConfigurationError ? 503 : 500).json({ error: isConfigurationError ? 'Integração do Firebase Admin pendente na Vercel' : 'Não foi possível validar a matrícula' });
  }
};
